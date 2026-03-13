"""
Alert and broadcast schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import Field
from uuid import UUID

from app.schemas.base import BaseSchema, IDSchema
from app.models.alerts import (
    BroadcastType, BroadcastPriority, BroadcastStatus,
    ChannelType, DeliveryStatus
)


# ============================================================================
# Broadcast Schemas
# ============================================================================

class BroadcastBase(BaseSchema):
    """Base broadcast schema."""
    
    title: str = Field(min_length=5, max_length=500)
    title_si: Optional[str] = None
    title_ta: Optional[str] = None
    message: str = Field(min_length=10)
    message_si: Optional[str] = None
    message_ta: Optional[str] = None
    broadcast_type: BroadcastType
    priority: BroadcastPriority = BroadcastPriority.MEDIUM


class BroadcastCreate(BroadcastBase):
    """Broadcast creation schema."""
    
    active_from: datetime
    active_to: Optional[datetime] = None
    target_districts: Optional[List[str]] = None  # District codes
    channels: Optional[List[ChannelType]] = None
    action_required: Optional[str] = None
    action_required_si: Optional[str] = None
    action_required_ta: Optional[str] = None
    related_shelter_ids: Optional[List[UUID]] = None
    related_route_ids: Optional[List[UUID]] = None
    requires_approval: bool = False
    metadata_json: Optional[dict[str, object]] = None


class BroadcastUpdate(BaseSchema):
    """Broadcast update schema."""
    
    title: Optional[str] = Field(default=None, min_length=5, max_length=500)
    title_si: Optional[str] = None
    title_ta: Optional[str] = None
    message: Optional[str] = Field(default=None, min_length=10)
    message_si: Optional[str] = None
    message_ta: Optional[str] = None
    broadcast_type: Optional[BroadcastType] = None
    priority: Optional[BroadcastPriority] = None
    active_from: Optional[datetime] = None
    active_to: Optional[datetime] = None
    target_districts: Optional[List[str]] = None
    action_required: Optional[str] = None


class BroadcastResponse(BroadcastBase, IDSchema):
    """Broadcast response schema."""
    
    status: BroadcastStatus
    active_from: datetime
    active_to: Optional[datetime] = None
    target_districts: Optional[List[str]] = None
    channels: Optional[List[str]] = None
    action_required: Optional[str] = None
    action_required_si: Optional[str] = None
    action_required_ta: Optional[str] = None
    author_id: Optional[UUID] = None
    requires_approval: bool
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BroadcastDetailResponse(BroadcastResponse):
    """Detailed broadcast response."""
    
    related_shelter_ids: Optional[List[UUID]] = None
    related_route_ids: Optional[List[UUID]] = None
    delivery_stats: Optional["DeliveryStatsResponse"] = None


class BroadcastListItem(BaseSchema):
    """Minimal broadcast for list views."""
    
    id: UUID
    title: str
    broadcast_type: BroadcastType
    priority: BroadcastPriority
    status: BroadcastStatus
    active_from: datetime
    active_to: Optional[datetime] = None
    target_districts: Optional[List[str]] = None
    created_at: datetime


class BroadcastListResponse(BaseSchema):
    """Paginated broadcast list response."""
    
    broadcasts: List[BroadcastListItem]
    total: int
    page: int
    page_size: int


# ============================================================================
# Broadcast Actions
# ============================================================================

class BroadcastApproveRequest(BaseSchema):
    """Broadcast approval request."""
    
    approved: bool
    notes: Optional[str] = None


class BroadcastCancelRequest(BaseSchema):
    """Broadcast cancellation request."""
    
    reason: str = Field(min_length=5, max_length=500)


# ============================================================================
# Delivery Schemas
# ============================================================================

class DeliveryStatsResponse(BaseSchema):
    """Broadcast delivery statistics."""
    
    total_recipients: int = 0
    pending: int = 0
    sent: int = 0
    delivered: int = 0
    failed: int = 0
    delivery_rate: float = 0.0
    by_channel: dict[str, int] = Field(default_factory=dict)


class NotificationDeliveryResponse(IDSchema):
    """Individual notification delivery response."""
    
    channel: ChannelType
    status: DeliveryStatus
    destination: str
    scheduled_at: datetime
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None


# ============================================================================
# Emergency Contact Schemas
# ============================================================================

class EmergencyContactBase(BaseSchema):
    """Base emergency contact schema."""
    
    name: str = Field(max_length=255)
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    category: str = Field(max_length=100)
    phone: str = Field(max_length=50)
    phone_alt: Optional[str] = None


class EmergencyContactCreate(EmergencyContactBase):
    """Emergency contact creation schema."""
    
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    coverage_districts: Optional[List[str]] = None
    display_order: int = 0
    is_featured: bool = False


class EmergencyContactUpdate(BaseSchema):
    """Emergency contact update schema."""
    
    name: Optional[str] = None
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    phone_alt: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    coverage_districts: Optional[List[str]] = None
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class EmergencyContactResponse(EmergencyContactBase, IDSchema):
    """Emergency contact response schema."""
    
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    coverage_districts: Optional[List[str]] = None
    display_order: int
    is_featured: bool
    is_active: bool


# ============================================================================
# User Notification Preferences
# ============================================================================

class NotificationPreferencesUpdate(BaseSchema):
    """User notification preferences update."""
    
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    voice_enabled: Optional[bool] = None
    receive_critical: Optional[bool] = None
    receive_high: Optional[bool] = None
    receive_medium: Optional[bool] = None
    receive_low: Optional[bool] = None
    home_district: Optional[str] = None
    watch_districts: Optional[List[str]] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    preferred_language: Optional[str] = Field(default=None, pattern="^(en|si|ta)$")


class NotificationPreferencesResponse(IDSchema):
    """User notification preferences response."""
    
    push_enabled: bool
    sms_enabled: bool
    email_enabled: bool
    voice_enabled: bool
    receive_critical: bool
    receive_high: bool
    receive_medium: bool
    receive_low: bool
    home_district: Optional[str] = None
    watch_districts: Optional[List[str]] = None
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    preferred_language: str


# ============================================================================
# Active Alerts for Frontend
# ============================================================================

class ActiveAlertResponse(BaseSchema):
    """Active alert for frontend display."""
    
    id: UUID
    title: str
    title_si: Optional[str] = None
    title_ta: Optional[str] = None
    message: str
    message_si: Optional[str] = None
    message_ta: Optional[str] = None
    broadcast_type: BroadcastType
    priority: BroadcastPriority
    action_required: Optional[str] = None
    action_required_si: Optional[str] = None
    action_required_ta: Optional[str] = None
    target_districts: Optional[List[str]] = None
    active_from: datetime
    active_to: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Name aliases used by broadcasts.py routes
# ---------------------------------------------------------------------------

BroadcastCreateRequest = BroadcastCreate
BroadcastUpdateRequest = BroadcastUpdate
BroadcastDeliveryStats = DeliveryStatsResponse
EmergencyContactCreateRequest = EmergencyContactCreate
EmergencyContactUpdateRequest = EmergencyContactUpdate
NotificationPreferencesUpdateRequest = NotificationPreferencesUpdate


class DeviceTokenRegisterRequest(BaseSchema):
    """Device push-notification token registration."""

    token: str
    platform: str = Field(max_length=50)
    device_name: Optional[str] = Field(default=None, max_length=255)


# Forward refs
BroadcastDetailResponse.model_rebuild()
