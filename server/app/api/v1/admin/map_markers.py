"""
Admin map markers management endpoints.
"""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import AdminUser
from app.services.admin_control_service import AdminControlService, ResourceNotFoundError, DuplicateResourceError

router = APIRouter(prefix="/map-markers", tags=["Admin - Map Markers"])


class MapMarkerResponse(BaseModel):
    id: str
    label: str
    markerType: str
    position: tuple[float, float]
    detail: str
    visible: bool


class MapMarkerCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    markerType: Literal["shelter", "hospital", "report", "infrastructure"]
    position: tuple[float, float]
    detail: str = Field(default="", max_length=500)
    visible: bool = True


class MapMarkerUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    markerType: Literal["shelter", "hospital", "report", "infrastructure"] | None = None
    position: tuple[float, float] | None = None
    detail: str | None = Field(default=None, max_length=500)
    visible: bool | None = None


@router.get("", response_model=list[MapMarkerResponse])
async def list_map_markers(
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MapMarkerResponse]:
    """List all map markers."""
    service = AdminControlService(db)
    markers = await service.list_map_markers()
    return [MapMarkerResponse(**m) for m in markers]


@router.get("/{marker_id}", response_model=MapMarkerResponse)
async def get_map_marker(
    marker_id: str,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MapMarkerResponse:
    """Get map marker by ID."""
    service = AdminControlService(db)
    try:
        marker = await service.get_map_marker(marker_id)
        return MapMarkerResponse(**marker)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=MapMarkerResponse, status_code=status.HTTP_201_CREATED)
async def create_map_marker(
    payload: MapMarkerCreateRequest,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MapMarkerResponse:
    """Create map marker."""
    service = AdminControlService(db)
    try:
        marker = await service.create_map_marker(
            label=payload.label,
            marker_type=payload.markerType,
            position=payload.position,
            detail=payload.detail,
            visible=payload.visible,
        )
        return MapMarkerResponse(**marker)
    except (ValueError, DuplicateResourceError) as e:
        status_code = status.HTTP_409_CONFLICT if isinstance(e, DuplicateResourceError) else status.HTTP_422_UNPROCESSABLE_ENTITY
        raise HTTPException(status_code=status_code, detail=str(e))


@router.patch("/{marker_id}", response_model=MapMarkerResponse)
async def update_map_marker(
    marker_id: str,
    payload: MapMarkerUpdateRequest,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MapMarkerResponse:
    """Update map marker."""
    service = AdminControlService(db)
    try:
        marker = await service.update_map_marker(
            marker_id=marker_id,
            label=payload.label,
            marker_type=payload.markerType,
            position=payload.position,
            detail=payload.detail,
            visible=payload.visible,
        )
        return MapMarkerResponse(**marker)
    except (ValueError, ResourceNotFoundError) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundError) else status.HTTP_422_UNPROCESSABLE_ENTITY
        raise HTTPException(status_code=status_code, detail=str(e))


@router.delete("/{marker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_map_marker(
    marker_id: str,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete map marker."""
    service = AdminControlService(db)
    try:
        await service.delete_map_marker(marker_id)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
