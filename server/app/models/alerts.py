"""
Alert broadcast and notification models.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel, AuditedModel


class BroadcastType(str, enum.Enum):
    """Broadcast type."""
    ALERT = "alert"
    WARNING = "warning"
    INFO = "info"
    UPDATE = "update"
    ALL_CLEAR = "all_clear"


class BroadcastPriority(str, enum.Enum):
    """Broadcast priority level."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BroadcastStatus(str, enum.Enum):
    """Broadcast status."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ChannelType(str, enum.Enum):
    """Notification channel type."""
    PUSH = "push"
    SMS = "sms"
    EMAIL = "email"
    IN_APP = "in_app"
    VOICE = "voice"
    WEBHOOK = "webhook"


class DeliveryStatus(str, enum.Enum):
    """Notification delivery status."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class Broadcast(AuditedModel):
    """Emergency broadcasts and alerts."""
    
    __tablename__ = "broadcasts"
    __table_args__ = (
        Index("ix_broadcasts_status", "status"),
        Index("ix_broadcasts_priority", "priority"),
        Index("ix_broadcasts_broadcast_type", "broadcast_type"),
        Index("ix_broadcasts_active_from", "active_from"),
        Index("ix_broadcasts_active_to", "active_to"),
        Index("ix_broadcasts_affected_area", "affected_area", postgresql_using="gist"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Sinhala
    title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Tamil
    
    message: Mapped[str] = mapped_column(Text, nullable=False)
    message_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    message_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    broadcast_type: Mapped[BroadcastType] = mapped_column(
        SQLEnum(BroadcastType, name="broadcast_type"),
        nullable=False,
    )
    priority: Mapped[BroadcastPriority] = mapped_column(
        SQLEnum(BroadcastPriority, name="broadcast_priority"),
        default=BroadcastPriority.MEDIUM,
        nullable=False,
    )
    status: Mapped[BroadcastStatus] = mapped_column(
        SQLEnum(BroadcastStatus, name="broadcast_status"),
        default=BroadcastStatus.DRAFT,
        nullable=False,
    )
    
    # Scheduling
    active_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    active_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Geographic targeting
    affected_area: Mapped[Optional[str]] = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326),
        nullable=True,
    )
    target_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # List of district codes
    
    # Channels
    channels: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # List of ChannelType values
    
    # Instructions
    action_required: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_required_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_required_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Related resources
    related_shelter_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    related_route_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Author
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    
    # Approval workflow
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Cancellation
    cancelled_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    targets: Mapped[List["BroadcastTarget"]] = relationship("BroadcastTarget", back_populates="broadcast")
    deliveries: Mapped[List["NotificationDelivery"]] = relationship("NotificationDelivery", back_populates="broadcast")


class BroadcastTarget(BaseModel):
    """Target audience for a broadcast."""
    
    __tablename__ = "broadcast_targets"
    __table_args__ = (
        Index("ix_broadcast_targets_broadcast_id", "broadcast_id"),
    )

    broadcast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("broadcasts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)  # district, role, user_group, all
    target_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # district code, role name, etc.
    
    # Estimated reach
    estimated_recipients: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    broadcast: Mapped["Broadcast"] = relationship("Broadcast", back_populates="targets")


class NotificationDelivery(BaseModel):
    """Individual notification delivery records."""
    
    __tablename__ = "notification_deliveries"
    __table_args__ = (
        Index("ix_notification_deliveries_broadcast_id", "broadcast_id"),
        Index("ix_notification_deliveries_user_id", "user_id"),
        Index("ix_notification_deliveries_status", "status"),
        Index("ix_notification_deliveries_channel", "channel"),
    )

    broadcast_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("broadcasts.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    channel: Mapped[ChannelType] = mapped_column(
        SQLEnum(ChannelType, name="channel_type"),
        nullable=False,
    )
    status: Mapped[DeliveryStatus] = mapped_column(
        SQLEnum(DeliveryStatus, name="delivery_status"),
        default=DeliveryStatus.PENDING,
        nullable=False,
    )
    
    # Delivery details
    destination: Mapped[str] = mapped_column(String(500), nullable=False)  # Email, phone, device token, etc.
    
    # Timestamps
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # External provider info
    provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    broadcast: Mapped[Optional["Broadcast"]] = relationship("Broadcast", back_populates="deliveries")


class EmergencyContact(AuditedModel):
    """Emergency contact numbers."""
    
    __tablename__ = "emergency_contacts"
    __table_args__ = (
        Index("ix_emergency_contacts_category", "category"),
        Index("ix_emergency_contacts_is_active", "is_active"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name_ta: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # police, fire, medical, etc.
    
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    phone_alt: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Coverage
    coverage_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # null = nationwide
    
    # Display order
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class UserNotificationPreference(BaseModel):
    """User notification preferences."""
    
    __tablename__ = "user_notification_preferences"
    __table_args__ = (
        Index("ix_user_notification_preferences_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Channel preferences
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Priority preferences
    receive_critical: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    receive_high: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    receive_medium: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    receive_low: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Geographic preferences
    home_district: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    watch_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # Additional districts to monitor
    
    # Quiet hours
    quiet_hours_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    quiet_hours_start: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)  # HH:MM
    quiet_hours_end: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    quiet_hours_override_critical: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Language preference
    preferred_language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)  # en, si, ta


class DeviceToken(BaseModel):
    """Push notification device tokens."""
    
    __tablename__ = "device_tokens"
    __table_args__ = (
        Index("ix_device_tokens_user_id", "user_id"),
        Index("ix_device_tokens_token", "token"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    token: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # ios, android, web
    
    # Device info
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    device_model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    os_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    app_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
