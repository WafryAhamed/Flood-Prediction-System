"""
District and GIS data API routes.
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import CurrentUserOptional, AdminUser
from app.models.gis import (
    District,
    RiskZone,
    RiskLevel,
    ZoneType,
    DistrictRiskSnapshot,
)
from app.schemas.gis import (
    DistrictResponse,
    DistrictDetailResponse,
    DistrictCreateRequest,
    DistrictUpdateRequest,
    RiskZoneResponse,
    RiskZoneCreateRequest,
    RiskZoneUpdateRequest,
    DistrictRiskSnapshotResponse,
)
from app.schemas.base import PaginatedResponse, MessageResponse


router = APIRouter(prefix="/districts", tags=["Districts & GIS"])


@router.get("", response_model=list[DistrictResponse])
async def list_districts(
    db: Annotated[AsyncSession, Depends(get_db)],
    include_inactive: bool = Query(False),
):
    """List all districts."""
    query = select(District)
    
    if not include_inactive:
        query = query.where(District.is_active == True)
    
    query = query.order_by(District.name)
    
    result = await db.execute(query)
    districts = result.scalars().all()
    
    return [DistrictResponse.model_validate(d) for d in districts]


@router.get("/{district_id}", response_model=DistrictDetailResponse)
async def get_district(
    district_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific district by ID."""
    query = (
        select(District)
        .where(District.id == district_id)
        .options(selectinload(District.risk_zones))
    )
    
    result = await db.execute(query)
    district = result.scalar_one_or_none()
    
    if district is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    return DistrictDetailResponse.model_validate(district)


@router.get("/code/{code}", response_model=DistrictDetailResponse)
async def get_district_by_code(
    code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a district by its code (e.g., 'CMB' for Colombo)."""
    query = (
        select(District)
        .where(District.code == code.upper())
        .options(selectinload(District.risk_zones))
    )
    
    result = await db.execute(query)
    district = result.scalar_one_or_none()
    
    if district is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    return DistrictDetailResponse.model_validate(district)


@router.post("", response_model=DistrictResponse, status_code=status.HTTP_201_CREATED)
async def create_district(
    data: DistrictCreateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new district (admin only)."""
    # Check for duplicate code
    existing = await db.execute(
        select(District).where(District.code == data.code.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="District code already exists",
        )
    
    district = District(
        code=data.code.upper(),
        name_en=data.name_en,
        name_si=data.name_si,
        name_ta=data.name_ta,
        province=data.province,
        area_sq_km=data.area_sq_km,
        population=data.population,
        centroid_lat=data.centroid_lat,
        centroid_lon=data.centroid_lon,
        current_risk_level=data.current_risk_level or RiskLevel.LOW,
    )
    
    db.add(district)
    await db.commit()
    await db.refresh(district)
    
    return DistrictResponse.model_validate(district)


@router.patch("/{district_id}", response_model=DistrictResponse)
async def update_district(
    district_id: UUID,
    data: DistrictUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a district (admin only)."""
    query = select(District).where(District.id == district_id)
    result = await db.execute(query)
    district = result.scalar_one_or_none()
    
    if district is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(district, field, value)
    
    await db.commit()
    await db.refresh(district)
    
    return DistrictResponse.model_validate(district)


@router.patch("/{district_id}/risk-level", response_model=DistrictResponse)
async def update_district_risk_level(
    district_id: UUID,
    risk_level: RiskLevel,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a district's current risk level (admin only)."""
    query = select(District).where(District.id == district_id)
    result = await db.execute(query)
    district = result.scalar_one_or_none()
    
    if district is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    district.current_risk_level = risk_level
    
    await db.commit()
    await db.refresh(district)
    
    return DistrictResponse.model_validate(district)


@router.get("/{district_id}/risk-history", response_model=list[DistrictRiskSnapshotResponse])
async def get_district_risk_history(
    district_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(30, ge=1, le=365),
):
    """Get historical risk snapshots for a district."""
    # Verify district exists
    district_result = await db.execute(
        select(District.id).where(District.id == district_id)
    )
    if not district_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    query = (
        select(DistrictRiskSnapshot)
        .where(DistrictRiskSnapshot.district_id == district_id)
        .order_by(DistrictRiskSnapshot.snapshot_date.desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    snapshots = result.scalars().all()
    
    return [DistrictRiskSnapshotResponse.model_validate(s) for s in snapshots]


# --- Risk Zones ---

@router.get("/{district_id}/zones", response_model=list[RiskZoneResponse])
async def list_district_risk_zones(
    district_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    zone_type: ZoneType | None = None,
    risk_level: RiskLevel | None = None,
):
    """List risk zones within a district."""
    query = select(RiskZone).where(
        RiskZone.district_id == district_id,
        RiskZone.is_active == True,
    )
    
    if zone_type:
        query = query.where(RiskZone.zone_type == zone_type)
    
    if risk_level:
        query = query.where(RiskZone.risk_level == risk_level)
    
    query = query.order_by(RiskZone.name_en)
    
    result = await db.execute(query)
    zones = result.scalars().all()
    
    return [RiskZoneResponse.model_validate(z) for z in zones]


@router.post("/{district_id}/zones", response_model=RiskZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_risk_zone(
    district_id: UUID,
    data: RiskZoneCreateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new risk zone within a district (admin only)."""
    # Verify district exists
    district_result = await db.execute(
        select(District.id).where(District.id == district_id)
    )
    if not district_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found",
        )
    
    zone = RiskZone(
        district_id=district_id,
        zone_code=data.zone_code,
        name_en=data.name_en,
        name_si=data.name_si,
        name_ta=data.name_ta,
        zone_type=data.zone_type,
        risk_level=data.risk_level,
        description=data.description,
        population_at_risk=data.population_at_risk,
        area_sq_km=data.area_sq_km,
        elevation_min=data.elevation_min,
        elevation_max=data.elevation_max,
    )
    
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    
    return RiskZoneResponse.model_validate(zone)


risk_zones_router = APIRouter(prefix="/risk-zones", tags=["Risk Zones"])


@risk_zones_router.get("", response_model=PaginatedResponse[RiskZoneResponse])
async def list_all_risk_zones(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    zone_type: ZoneType | None = None,
    risk_level: RiskLevel | None = None,
):
    """List all risk zones across all districts."""
    query = select(RiskZone).where(RiskZone.is_active == True)
    count_query = select(func.count(RiskZone.id)).where(RiskZone.is_active == True)
    
    if zone_type:
        query = query.where(RiskZone.zone_type == zone_type)
        count_query = count_query.where(RiskZone.zone_type == zone_type)
    
    if risk_level:
        query = query.where(RiskZone.risk_level == risk_level)
        count_query = count_query.where(RiskZone.risk_level == risk_level)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(RiskZone.risk_level.desc(), RiskZone.name_en)
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    zones = result.scalars().all()
    
    return PaginatedResponse(
        items=[RiskZoneResponse.model_validate(z) for z in zones],
        total=total,
        page=page,
        page_size=page_size,
    )


@risk_zones_router.get("/{zone_id}", response_model=RiskZoneResponse)
async def get_risk_zone(
    zone_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific risk zone."""
    query = select(RiskZone).where(RiskZone.id == zone_id)
    result = await db.execute(query)
    zone = result.scalar_one_or_none()
    
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk zone not found",
        )
    
    return RiskZoneResponse.model_validate(zone)


@risk_zones_router.patch("/{zone_id}", response_model=RiskZoneResponse)
async def update_risk_zone(
    zone_id: UUID,
    data: RiskZoneUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a risk zone (admin only)."""
    query = select(RiskZone).where(RiskZone.id == zone_id)
    result = await db.execute(query)
    zone = result.scalar_one_or_none()
    
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk zone not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)
    
    await db.commit()
    await db.refresh(zone)
    
    return RiskZoneResponse.model_validate(zone)


@risk_zones_router.delete("/{zone_id}", response_model=MessageResponse)
async def delete_risk_zone(
    zone_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft delete a risk zone (admin only)."""
    query = select(RiskZone).where(RiskZone.id == zone_id)
    result = await db.execute(query)
    zone = result.scalar_one_or_none()
    
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk zone not found",
        )
    
    zone.is_active = False
    await db.commit()
    
    return MessageResponse(message="Risk zone deleted", success=True)
