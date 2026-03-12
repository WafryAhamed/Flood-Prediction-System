"""
Shelter and evacuation API routes.
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import CurrentUserOptional, AdminUser, OperatorUser
from app.models.gis import (
    Shelter,
    FacilityType,
    FacilityStatus,
    EvacuationRoute,
    RouteStatus,
)
from app.schemas.gis import (
    ShelterResponse,
    ShelterDetailResponse,
    ShelterCreateRequest,
    ShelterUpdateRequest,
    ShelterCapacityUpdate,
    EvacuationRouteResponse,
    EvacuationRouteCreateRequest,
    EvacuationRouteUpdateRequest,
)
from app.schemas.base import PaginatedResponse, MessageResponse


router = APIRouter(prefix="/shelters", tags=["Shelters"])


@router.get("", response_model=PaginatedResponse[ShelterResponse])
async def list_shelters(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    district_id: UUID | None = None,
    facility_type: FacilityType | None = None,
    status_filter: FacilityStatus | None = Query(None, alias="status"),
    has_availability: bool | None = Query(None, description="Filter shelters with available capacity"),
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
):
    """List shelters with filtering."""
    query = select(Shelter).where(Shelter.is_active == True)
    count_query = select(func.count(Shelter.id)).where(Shelter.is_active == True)
    
    if district_id:
        query = query.where(Shelter.district_id == district_id)
        count_query = count_query.where(Shelter.district_id == district_id)
    
    if facility_type:
        query = query.where(Shelter.facility_type == facility_type)
        count_query = count_query.where(Shelter.facility_type == facility_type)
    
    if status_filter:
        query = query.where(Shelter.status == status_filter)
        count_query = count_query.where(Shelter.status == status_filter)
    
    if has_availability is True:
        avail_filter = Shelter.current_occupancy < Shelter.capacity
        query = query.where(avail_filter)
        count_query = count_query.where(avail_filter)
    
    # Bounding box filter
    if all([min_lat, max_lat, min_lon, max_lon]):
        bbox_filter = and_(
            Shelter.latitude >= min_lat,
            Shelter.latitude <= max_lat,
            Shelter.longitude >= min_lon,
            Shelter.longitude <= max_lon,
        )
        query = query.where(bbox_filter)
        count_query = count_query.where(bbox_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(Shelter.name_en)
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    shelters = result.scalars().all()
    
    return PaginatedResponse(
        items=[ShelterResponse.model_validate(s) for s in shelters],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/nearby", response_model=list[ShelterResponse])
async def find_nearby_shelters(
    lat: float,
    lon: float,
    db: Annotated[AsyncSession, Depends(get_db)],
    radius_km: float = Query(10.0, ge=0.1, le=100),
    limit: int = Query(10, ge=1, le=50),
    has_availability: bool = Query(True),
):
    """
    Find shelters near a given location.
    
    Uses simplified distance calculation. In production, use PostGIS ST_DWithin.
    """
    # Simplified bounding box approach (approximately 1 degree ≈ 111 km)
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * abs(lat) if lat != 0 else 111.0)
    
    query = select(Shelter).where(
        Shelter.is_active == True,
        Shelter.status == FacilityStatus.ACTIVE,
        Shelter.latitude.between(lat - lat_delta, lat + lat_delta),
        Shelter.longitude.between(lon - lon_delta, lon + lon_delta),
    )
    
    if has_availability:
        query = query.where(Shelter.current_occupancy < Shelter.capacity)
    
    query = query.limit(limit)
    
    result = await db.execute(query)
    shelters = result.scalars().all()
    
    return [ShelterResponse.model_validate(s) for s in shelters]


@router.get("/{shelter_id}", response_model=ShelterDetailResponse)
async def get_shelter(
    shelter_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific shelter by ID."""
    query = select(Shelter).where(Shelter.id == shelter_id)
    result = await db.execute(query)
    shelter = result.scalar_one_or_none()
    
    if shelter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found",
        )
    
    return ShelterDetailResponse.model_validate(shelter)


@router.post("", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
async def create_shelter(
    data: ShelterCreateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new shelter (admin only)."""
    shelter = Shelter(
        name_en=data.name_en,
        name_si=data.name_si,
        name_ta=data.name_ta,
        district_id=data.district_id,
        facility_type=data.facility_type,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        capacity=data.capacity,
        current_occupancy=0,
        status=FacilityStatus.ACTIVE,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        amenities=data.amenities or [],
        accessibility_features=data.accessibility_features or [],
        notes=data.notes,
    )
    
    db.add(shelter)
    await db.commit()
    await db.refresh(shelter)
    
    return ShelterResponse.model_validate(shelter)


@router.patch("/{shelter_id}", response_model=ShelterResponse)
async def update_shelter(
    shelter_id: UUID,
    data: ShelterUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a shelter (admin only)."""
    query = select(Shelter).where(Shelter.id == shelter_id)
    result = await db.execute(query)
    shelter = result.scalar_one_or_none()
    
    if shelter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shelter, field, value)
    
    await db.commit()
    await db.refresh(shelter)
    
    return ShelterResponse.model_validate(shelter)


@router.patch("/{shelter_id}/occupancy", response_model=ShelterResponse)
async def update_shelter_occupancy(
    shelter_id: UUID,
    data: ShelterCapacityUpdate,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update shelter occupancy (operator and above)."""
    query = select(Shelter).where(Shelter.id == shelter_id)
    result = await db.execute(query)
    shelter = result.scalar_one_or_none()
    
    if shelter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found",
        )
    
    if data.current_occupancy is not None:
        if data.current_occupancy < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Occupancy cannot be negative",
            )
        if data.current_occupancy > shelter.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Occupancy cannot exceed capacity",
            )
        shelter.current_occupancy = data.current_occupancy
    
    if data.capacity is not None:
        if data.capacity < shelter.current_occupancy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Capacity cannot be less than current occupancy",
            )
        shelter.capacity = data.capacity
    
    await db.commit()
    await db.refresh(shelter)
    
    return ShelterResponse.model_validate(shelter)


@router.patch("/{shelter_id}/status", response_model=ShelterResponse)
async def update_shelter_status(
    shelter_id: UUID,
    new_status: FacilityStatus,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update shelter status (operator and above)."""
    query = select(Shelter).where(Shelter.id == shelter_id)
    result = await db.execute(query)
    shelter = result.scalar_one_or_none()
    
    if shelter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found",
        )
    
    shelter.status = new_status
    
    await db.commit()
    await db.refresh(shelter)
    
    return ShelterResponse.model_validate(shelter)


@router.delete("/{shelter_id}", response_model=MessageResponse)
async def delete_shelter(
    shelter_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft delete a shelter (admin only)."""
    query = select(Shelter).where(Shelter.id == shelter_id)
    result = await db.execute(query)
    shelter = result.scalar_one_or_none()
    
    if shelter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found",
        )
    
    shelter.is_active = False
    await db.commit()
    
    return MessageResponse(message="Shelter deleted", success=True)


# --- Evacuation Routes ---

evacuation_router = APIRouter(prefix="/evacuation-routes", tags=["Evacuation Routes"])


@evacuation_router.get("", response_model=PaginatedResponse[EvacuationRouteResponse])
async def list_evacuation_routes(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    district_id: UUID | None = None,
    status_filter: RouteStatus | None = Query(None, alias="status"),
    destination_shelter_id: UUID | None = None,
):
    """List evacuation routes."""
    query = select(EvacuationRoute).where(EvacuationRoute.is_active == True)
    count_query = select(func.count(EvacuationRoute.id)).where(EvacuationRoute.is_active == True)
    
    if district_id:
        query = query.where(EvacuationRoute.district_id == district_id)
        count_query = count_query.where(EvacuationRoute.district_id == district_id)
    
    if status_filter:
        query = query.where(EvacuationRoute.status == status_filter)
        count_query = count_query.where(EvacuationRoute.status == status_filter)
    
    if destination_shelter_id:
        query = query.where(EvacuationRoute.destination_shelter_id == destination_shelter_id)
        count_query = count_query.where(EvacuationRoute.destination_shelter_id == destination_shelter_id)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(EvacuationRoute.name_en)
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    routes = result.scalars().all()
    
    return PaginatedResponse(
        items=[EvacuationRouteResponse.model_validate(r) for r in routes],
        total=total,
        page=page,
        page_size=page_size,
    )


@evacuation_router.get("/{route_id}", response_model=EvacuationRouteResponse)
async def get_evacuation_route(
    route_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific evacuation route."""
    query = select(EvacuationRoute).where(EvacuationRoute.id == route_id)
    result = await db.execute(query)
    route = result.scalar_one_or_none()
    
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evacuation route not found",
        )
    
    return EvacuationRouteResponse.model_validate(route)


@evacuation_router.post("", response_model=EvacuationRouteResponse, status_code=status.HTTP_201_CREATED)
async def create_evacuation_route(
    data: EvacuationRouteCreateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new evacuation route (admin only)."""
    route = EvacuationRoute(
        name_en=data.name_en,
        name_si=data.name_si,
        name_ta=data.name_ta,
        district_id=data.district_id,
        origin_zone_id=data.origin_zone_id,
        destination_shelter_id=data.destination_shelter_id,
        distance_km=data.distance_km,
        estimated_time_minutes=data.estimated_time_minutes,
        status=RouteStatus.OPEN,
        description=data.description,
        waypoints=data.waypoints,
    )
    
    db.add(route)
    await db.commit()
    await db.refresh(route)
    
    return EvacuationRouteResponse.model_validate(route)


@evacuation_router.patch("/{route_id}", response_model=EvacuationRouteResponse)
async def update_evacuation_route(
    route_id: UUID,
    data: EvacuationRouteUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an evacuation route (admin only)."""
    query = select(EvacuationRoute).where(EvacuationRoute.id == route_id)
    result = await db.execute(query)
    route = result.scalar_one_or_none()
    
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evacuation route not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(route, field, value)
    
    await db.commit()
    await db.refresh(route)
    
    return EvacuationRouteResponse.model_validate(route)


@evacuation_router.patch("/{route_id}/status", response_model=EvacuationRouteResponse)
async def update_route_status(
    route_id: UUID,
    new_status: RouteStatus,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update evacuation route status (operator and above)."""
    query = select(EvacuationRoute).where(EvacuationRoute.id == route_id)
    result = await db.execute(query)
    route = result.scalar_one_or_none()
    
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evacuation route not found",
        )
    
    route.status = new_status
    
    await db.commit()
    await db.refresh(route)
    
    return EvacuationRouteResponse.model_validate(route)


@evacuation_router.delete("/{route_id}", response_model=MessageResponse)
async def delete_evacuation_route(
    route_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft delete an evacuation route (admin only)."""
    query = select(EvacuationRoute).where(EvacuationRoute.id == route_id)
    result = await db.execute(query)
    route = result.scalar_one_or_none()
    
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evacuation route not found",
        )
    
    route.is_active = False
    await db.commit()
    
    return MessageResponse(message="Evacuation route deleted", success=True)
