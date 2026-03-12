"""
Citizen report and moderation models.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel, AuditedModel


class ReportType(str, enum.Enum):
    """Type of citizen report."""
    FLOOD = "flood"
    ROAD_BLOCKED = "road_blocked"
    LANDSLIDE = "landslide"
    POWER_OUTAGE = "power_outage"
    WATER_SUPPLY = "water_supply"
    SHELTER_ISSUE = "shelter_issue"
    RESCUE_NEEDED = "rescue_needed"
    DEBRIS = "debris"
    CONTAMINATION = "contamination"
    INFRASTRUCTURE_DAMAGE = "infrastructure_damage"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    """Report workflow status."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"


class UrgencyLevel(str, enum.Enum):
    """Report urgency level."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MediaType(str, enum.Enum):
    """Media attachment type."""
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class CitizenReport(AuditedModel):
    """Citizen-submitted incident reports."""
    
    __tablename__ = "citizen_reports"
    __table_args__ = (
        Index("ix_citizen_reports_status", "status"),
        Index("ix_citizen_reports_report_type", "report_type"),
        Index("ix_citizen_reports_district_id", "district_id"),
        Index("ix_citizen_reports_urgency", "urgency"),
        Index("ix_citizen_reports_geom", "geom", postgresql_using="gist"),
        Index("ix_citizen_reports_submitted_at", "submitted_at"),
        CheckConstraint("urgency_score >= 0 AND urgency_score <= 100", name="ck_urgency_score_range"),
    )

    # Unique public-facing report ID
    public_id: Mapped[str] = mapped_column(
        String(20), 
        unique=True, 
        nullable=False,
        index=True,
    )
    
    report_type: Mapped[ReportType] = mapped_column(
        SQLEnum(ReportType, name="report_type"),
        nullable=False,
    )
    status: Mapped[ReportStatus] = mapped_column(
        SQLEnum(ReportStatus, name="report_status"),
        default=ReportStatus.PENDING,
        nullable=False,
    )
    urgency: Mapped[UrgencyLevel] = mapped_column(
        SQLEnum(UrgencyLevel, name="urgency_level"),
        default=UrgencyLevel.MEDIUM,
        nullable=False,
    )
    urgency_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)  # 0-100
    
    # Content
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # District
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Reporter info (anonymous allowed)
    reporter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reporter_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reporter_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Moderation
    moderator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    moderator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # AI verification
    ai_verification_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-1
    ai_flags: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Dispatch info
    dispatch_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_team: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Resolution info
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # People affected
    people_affected: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Trust scoring
    source_trust_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)  # Inherited from reporter
    
    # Visibility
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    district: Mapped[Optional["District"]] = relationship("District", back_populates="reports")
    reporter: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reporter_id])
    moderator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[moderator_id])
    media: Mapped[List["ReportMedia"]] = relationship("ReportMedia", back_populates="report", cascade="all, delete-orphan")
    events: Mapped[List["ReportEvent"]] = relationship("ReportEvent", back_populates="report", cascade="all, delete-orphan")
    upvotes: Mapped[List["ReportUpvote"]] = relationship("ReportUpvote", back_populates="report", cascade="all, delete-orphan")


class ReportMedia(BaseModel):
    """Media attachments for reports."""
    
    __tablename__ = "report_media"
    __table_args__ = (
        Index("ix_report_media_report_id", "report_id"),
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    media_type: Mapped[MediaType] = mapped_column(
        SQLEnum(MediaType, name="media_type"),
        nullable=False,
    )
    
    # Storage
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Local storage path
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # For video/audio
    
    # AI analysis
    ai_caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_labels: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_nsfw: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Location from EXIF
    exif_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exif_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exif_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    report: Mapped["CitizenReport"] = relationship("CitizenReport", back_populates="media")


class ReportEvent(BaseModel):
    """Timeline events for a report (status changes, notes, etc.)."""
    
    __tablename__ = "report_events"
    __table_args__ = (
        Index("ix_report_events_report_id", "report_id"),
        Index("ix_report_events_event_at", "event_at"),
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # status_change, note_added, etc.
    event_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Actor
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    actor_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Event details
    old_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    report: Mapped["CitizenReport"] = relationship("CitizenReport", back_populates="events")


class ReportUpvote(BaseModel):
    """User upvotes/confirmations for reports."""
    
    __tablename__ = "report_upvotes"
    __table_args__ = (
        Index("ix_report_upvotes_report_id", "report_id"),
        Index("ix_report_upvotes_user_id", "user_id"),
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Optional location to verify proximity
    user_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    user_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Trust score of upvoter at time of upvote
    voter_trust_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    
    # Relationships
    report: Mapped["CitizenReport"] = relationship("CitizenReport", back_populates="upvotes")


class ReportVerificationScore(BaseModel):
    """Aggregate verification scores for reports."""
    
    __tablename__ = "report_verification_scores"
    __table_args__ = (
        Index("ix_report_verification_scores_report_id", "report_id"),
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Scores (0-1)
    ai_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    community_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    location_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    media_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    
    # Weighted final score
    final_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    
    # Counts
    upvote_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    weighted_upvotes: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # Last recalculated
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
