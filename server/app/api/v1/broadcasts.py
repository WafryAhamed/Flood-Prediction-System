"""
Broadcast and notification API routes.
"""
from typing import Annotated
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import CurrentUser, AdminUser, OperatorUser
from app.models.alerts import (
    Broadcast,
    BroadcastType,
    BroadcastPriority,
    BroadcastStatus,
    BroadcastTarget,
    NotificationDelivery,
    ChannelType,
    DeliveryStatus,
    EmergencyContact,
    UserNotificationPreference,
    DeviceToken,
)
from app.schemas.alerts import (
    BroadcastResponse,
    BroadcastDetailResponse,
    BroadcastCreateRequest,
    BroadcastUpdateRequest,
    BroadcastDeliveryStats,
    EmergencyContactResponse,
    EmergencyContactCreateRequest,
    EmergencyContactUpdateRequest,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdateRequest,
    DeviceTokenRegisterRequest,
)
from app.schemas.base import PaginatedResponse, MessageResponse


router = APIRouter(prefix="/broadcasts", tags=["Broadcasts & Alerts"])


@router.get("", response_model=PaginatedResponse[BroadcastResponse])
async def list_broadcasts(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    broadcast_type: BroadcastType | None = None,
    priority: BroadcastPriority | None = None,
    status_filter: BroadcastStatus | None = Query(None, alias="status"),
    district_id: UUID | None = None,
    active_only: bool = Query(True),
):
    """List broadcasts with filtering."""
    query = select(Broadcast)
    count_query = select(func.count(Broadcast.id))
    
    if broadcast_type:
        query = query.where(Broadcast.broadcast_type == broadcast_type)
        count_query = count_query.where(Broadcast.broadcast_type == broadcast_type)
    
    if priority:
        query = query.where(Broadcast.priority == priority)
        count_query = count_query.where(Broadcast.priority == priority)
    
    if status_filter:
        query = query.where(Broadcast.status == status_filter)
        count_query = count_query.where(Broadcast.status == status_filter)
    
    if active_only:
        now = datetime.utcnow()
        active_filter = (
            (Broadcast.status == BroadcastStatus.PUBLISHED) &
            ((Broadcast.expires_at.is_(None)) | (Broadcast.expires_at > now))
        )
        query = query.where(active_filter)
        count_query = count_query.where(active_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(Broadcast.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    broadcasts = result.scalars().all()
    
    return PaginatedResponse(
        items=[BroadcastResponse.model_validate(b) for b in broadcasts],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/active", response_model=list[BroadcastResponse])
async def get_active_broadcasts(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    limit: int = Query(10, ge=1, le=50),
):
    """Get currently active broadcasts for display."""
    now = datetime.utcnow()
    
    query = select(Broadcast).where(
        Broadcast.status == BroadcastStatus.PUBLISHED,
        (Broadcast.expires_at.is_(None)) | (Broadcast.expires_at > now),
    )
    
    # Filter by district if specified
    if district_id:
        # This would need a subquery on BroadcastTarget
        # Simplified for now - in production use proper join
        pass
    
    query = query.order_by(Broadcast.priority.desc(), Broadcast.created_at.desc())
    query = query.limit(limit)
    
    result = await db.execute(query)
    broadcasts = result.scalars().all()
    
    return [BroadcastResponse.model_validate(b) for b in broadcasts]


@router.get("/{broadcast_id}", response_model=BroadcastDetailResponse)
async def get_broadcast(
    broadcast_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific broadcast by ID."""
    query = (
        select(Broadcast)
        .where(Broadcast.id == broadcast_id)
        .options(selectinload(Broadcast.targets))
    )
    
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    return BroadcastDetailResponse.model_validate(broadcast)


@router.get("/{broadcast_id}/delivery-stats", response_model=BroadcastDeliveryStats)
async def get_broadcast_delivery_stats(
    broadcast_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get delivery statistics for a broadcast (operator and above)."""
    # Verify broadcast exists
    broadcast_result = await db.execute(
        select(Broadcast.id).where(Broadcast.id == broadcast_id)
    )
    if not broadcast_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    # Get delivery counts by status
    stats_query = (
        select(NotificationDelivery.status, func.count(NotificationDelivery.id))
        .where(NotificationDelivery.broadcast_id == broadcast_id)
        .group_by(NotificationDelivery.status)
    )
    
    stats_result = await db.execute(stats_query)
    status_counts = {str(row[0].value): row[1] for row in stats_result.all()}
    
    # Get channel breakdown
    channel_query = (
        select(NotificationDelivery.channel, func.count(NotificationDelivery.id))
        .where(NotificationDelivery.broadcast_id == broadcast_id)
        .group_by(NotificationDelivery.channel)
    )
    
    channel_result = await db.execute(channel_query)
    channel_counts = {str(row[0].value): row[1] for row in channel_result.all()}
    
    total = sum(status_counts.values())
    delivered = status_counts.get("delivered", 0)
    failed = status_counts.get("failed", 0)
    
    return BroadcastDeliveryStats(
        total_recipients=total,
        delivered=delivered,
        pending=status_counts.get("pending", 0),
        failed=failed,
        delivery_rate=delivered / total * 100 if total > 0 else 0,
        by_channel=channel_counts,
    )


@router.post("", response_model=BroadcastResponse, status_code=status.HTTP_201_CREATED)
async def create_broadcast(
    data: BroadcastCreateRequest,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new broadcast (operator and above)."""
    broadcast = Broadcast(
        broadcast_type=data.broadcast_type,
        priority=data.priority,
        title_en=data.title_en,
        title_si=data.title_si,
        title_ta=data.title_ta,
        message_en=data.message_en,
        message_si=data.message_si,
        message_ta=data.message_ta,
        instructions_en=data.instructions_en,
        instructions_si=data.instructions_si,
        instructions_ta=data.instructions_ta,
        created_by_id=operator.id,
        status=BroadcastStatus.DRAFT,
        channels=data.channels or [ChannelType.IN_APP],
        expires_at=data.expires_at,
        source_system=data.source_system,
        metadata=data.metadata,
    )
    
    db.add(broadcast)
    await db.flush()  # Get the ID
    
    # Add targets
    if data.target_district_ids:
        for district_id in data.target_district_ids:
            target = BroadcastTarget(
                broadcast_id=broadcast.id,
                district_id=district_id,
            )
            db.add(target)
    
    if data.target_zone_ids:
        for zone_id in data.target_zone_ids:
            target = BroadcastTarget(
                broadcast_id=broadcast.id,
                zone_id=zone_id,
            )
            db.add(target)
    
    await db.commit()
    await db.refresh(broadcast)
    
    return BroadcastResponse.model_validate(broadcast)


@router.patch("/{broadcast_id}", response_model=BroadcastResponse)
async def update_broadcast(
    broadcast_id: UUID,
    data: BroadcastUpdateRequest,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a broadcast (operator and above)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    # Only draft broadcasts can be edited
    if broadcast.status not in [BroadcastStatus.DRAFT, BroadcastStatus.SCHEDULED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or scheduled broadcasts can be edited",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(broadcast, field, value)
    
    await db.commit()
    await db.refresh(broadcast)
    
    return BroadcastResponse.model_validate(broadcast)


@router.post("/{broadcast_id}/publish", response_model=BroadcastResponse)
async def publish_broadcast(
    broadcast_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Publish a draft broadcast (operator and above)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    if broadcast.status != BroadcastStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft broadcasts can be published",
        )
    
    broadcast.status = BroadcastStatus.PUBLISHED
    broadcast.published_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(broadcast)
    
    # In production, trigger async task to deliver notifications
    # await celery_app.send_task("deliver_broadcast", args=[str(broadcast.id)])
    
    return BroadcastResponse.model_validate(broadcast)


@router.post("/{broadcast_id}/cancel", response_model=BroadcastResponse)
async def cancel_broadcast(
    broadcast_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Cancel a scheduled or published broadcast (operator and above)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    if broadcast.status == BroadcastStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Broadcast is already cancelled",
        )
    
    broadcast.status = BroadcastStatus.CANCELLED
    
    await db.commit()
    await db.refresh(broadcast)
    
    return BroadcastResponse.model_validate(broadcast)


@router.delete("/{broadcast_id}", response_model=MessageResponse)
async def delete_broadcast(
    broadcast_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a draft broadcast (admin only)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    if broadcast.status != BroadcastStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft broadcasts can be deleted",
        )
    
    await db.delete(broadcast)
    await db.commit()
    
    return MessageResponse(message="Broadcast deleted", success=True)


# --- User Notification Preferences ---

preferences_router = APIRouter(prefix="/notification-preferences", tags=["Notification Preferences"])


@preferences_router.get("/me", response_model=NotificationPreferencesResponse)
async def get_my_notification_preferences(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get current user's notification preferences."""
    query = select(UserNotificationPreference).where(
        UserNotificationPreference.user_id == current_user.id
    )
    result = await db.execute(query)
    prefs = result.scalar_one_or_none()
    
    if prefs is None:
        # Return defaults
        return NotificationPreferencesResponse(
            user_id=current_user.id,
            push_enabled=True,
            sms_enabled=False,
            email_enabled=True,
            in_app_enabled=True,
            quiet_hours_enabled=False,
            min_priority_for_quiet_hours="critical",
            language_preference=current_user.preferred_language,
        )
    
    return NotificationPreferencesResponse.model_validate(prefs)


@preferences_router.put("/me", response_model=NotificationPreferencesResponse)
async def update_my_notification_preferences(
    data: NotificationPreferencesUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current user's notification preferences."""
    query = select(UserNotificationPreference).where(
        UserNotificationPreference.user_id == current_user.id
    )
    result = await db.execute(query)
    prefs = result.scalar_one_or_none()
    
    if prefs is None:
        # Create new
        prefs = UserNotificationPreference(
            user_id=current_user.id,
            **data.model_dump(exclude_unset=True),
        )
        db.add(prefs)
    else:
        # Update existing
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prefs, field, value)
    
    await db.commit()
    await db.refresh(prefs)
    
    return NotificationPreferencesResponse.model_validate(prefs)


# --- Emergency Contacts ---

contacts_router = APIRouter(prefix="/emergency-contacts", tags=["Emergency Contacts"])


@contacts_router.get("/me", response_model=list[EmergencyContactResponse])
async def get_my_emergency_contacts(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get current user's emergency contacts."""
    query = (
        select(EmergencyContact)
        .where(EmergencyContact.user_id == current_user.id)
        .order_by(EmergencyContact.priority)
    )
    result = await db.execute(query)
    contacts = result.scalars().all()
    
    return [EmergencyContactResponse.model_validate(c) for c in contacts]


@contacts_router.post("/me", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def add_emergency_contact(
    data: EmergencyContactCreateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add an emergency contact."""
    # Count existing contacts
    count_result = await db.execute(
        select(func.count(EmergencyContact.id)).where(
            EmergencyContact.user_id == current_user.id
        )
    )
    count = count_result.scalar() or 0
    
    if count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 5 emergency contacts allowed",
        )
    
    contact = EmergencyContact(
        user_id=current_user.id,
        name=data.name,
        relationship=data.relationship,
        phone=data.phone,
        email=data.email,
        priority=data.priority or count + 1,
        notify_on_emergency=data.notify_on_emergency,
    )
    
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    
    return EmergencyContactResponse.model_validate(contact)


@contacts_router.patch("/me/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: UUID,
    data: EmergencyContactUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an emergency contact."""
    query = select(EmergencyContact).where(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    )
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found",
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    await db.commit()
    await db.refresh(contact)
    
    return EmergencyContactResponse.model_validate(contact)


@contacts_router.delete("/me/{contact_id}", response_model=MessageResponse)
async def delete_emergency_contact(
    contact_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an emergency contact."""
    query = select(EmergencyContact).where(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    )
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found",
        )
    
    await db.delete(contact)
    await db.commit()
    
    return MessageResponse(message="Emergency contact deleted", success=True)


# --- Device Tokens (for push notifications) ---

devices_router = APIRouter(prefix="/devices", tags=["Device Registration"])


@devices_router.post("/register", response_model=MessageResponse)
async def register_device(
    data: DeviceTokenRegisterRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a device for push notifications."""
    # Check if token already exists
    existing = await db.execute(
        select(DeviceToken).where(DeviceToken.token == data.token)
    )
    existing_token = existing.scalar_one_or_none()
    
    if existing_token:
        # Update existing token ownership
        existing_token.user_id = current_user.id
        existing_token.platform = data.platform
        existing_token.device_name = data.device_name
        existing_token.is_active = True
    else:
        # Create new
        device_token = DeviceToken(
            user_id=current_user.id,
            token=data.token,
            platform=data.platform,
            device_name=data.device_name,
            is_active=True,
        )
        db.add(device_token)
    
    await db.commit()
    
    return MessageResponse(message="Device registered successfully", success=True)


@devices_router.delete("/unregister", response_model=MessageResponse)
async def unregister_device(
    token: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Unregister a device from push notifications."""
    query = select(DeviceToken).where(
        DeviceToken.token == token,
        DeviceToken.user_id == current_user.id,
    )
    result = await db.execute(query)
    device_token = result.scalar_one_or_none()
    
    if device_token:
        device_token.is_active = False
        await db.commit()
    
    return MessageResponse(message="Device unregistered", success=True)
