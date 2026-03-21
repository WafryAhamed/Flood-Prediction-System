"""
Admin emergency contacts management endpoints.
"""

from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import AdminUser
from app.services.admin_control_service import AdminControlService, ResourceNotFoundError, DuplicateResourceError

router = APIRouter(prefix="/emergency-contacts", tags=["Admin - Emergency Contacts"])


class EmergencyContactResponse(BaseModel):
    id: str
    label: str
    number: str
    type: str
    active: bool


class EmergencyContactCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    number: str = Field(min_length=1, max_length=50)
    type: Literal["police", "ambulance", "fire", "disaster", "custom"] = "custom"
    active: bool = True


class EmergencyContactUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    number: str | None = Field(default=None, min_length=1, max_length=50)
    type: Literal["police", "ambulance", "fire", "disaster", "custom"] | None = None
    active: bool | None = None


@router.get("", response_model=list[EmergencyContactResponse])
async def list_emergency_contacts(
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EmergencyContactResponse]:
    """List all emergency contacts."""
    service = AdminControlService(db)
    contacts = await service.list_emergency_contacts()
    return [EmergencyContactResponse(**c) for c in contacts]


@router.get("/{contact_id}", response_model=EmergencyContactResponse)
async def get_emergency_contact(
    contact_id: UUID,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmergencyContactResponse:
    """Get emergency contact by ID."""
    service = AdminControlService(db)
    try:
        contact = await service.get_emergency_contact(contact_id)
        return EmergencyContactResponse(**contact)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    payload: EmergencyContactCreateRequest,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmergencyContactResponse:
    """Create emergency contact."""
    service = AdminControlService(db)
    try:
        contact = await service.create_emergency_contact(
            label=payload.label,
            phone=payload.number,
            contact_type=payload.type,
            active=payload.active,
        )
        return EmergencyContactResponse(**contact)
    except DuplicateResourceError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: UUID,
    payload: EmergencyContactUpdateRequest,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmergencyContactResponse:
    """Update emergency contact."""
    service = AdminControlService(db)
    try:
        contact = await service.update_emergency_contact(
            contact_id=contact_id,
            label=payload.label,
            phone=payload.number,
            contact_type=payload.type,
            active=payload.active,
        )
        return EmergencyContactResponse(**contact)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(
    contact_id: UUID,
    _admin: Annotated[dict, Depends(AdminUser)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete emergency contact."""
    service = AdminControlService(db)
    try:
        await service.delete_emergency_contact(contact_id)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
