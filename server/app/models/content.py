"""
Content models for agriculture, recovery, learn hub, and resources.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel, AuditedModel


class ContentStatus(str, enum.Enum):
    """Content publication status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CropStatus(str, enum.Enum):
    """Agricultural crop status."""
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    DAMAGED = "damaged"
    DESTROYED = "destroyed"


class RecoveryPhase(str, enum.Enum):
    """Recovery program phase."""
    ASSESSMENT = "assessment"
    PLANNING = "planning"
    IMPLEMENTATION = "implementation"
    MONITORING = "monitoring"
    COMPLETED = "completed"


class RecoveryCategory(str, enum.Enum):
    """Recovery category."""
    INFRASTRUCTURE = "infrastructure"
    HOUSING = "housing"
    AGRICULTURE = "agriculture"
    LIVELIHOOD = "livelihood"
    HEALTH = "health"
    EDUCATION = "education"
    UTILITIES = "utilities"


# ============================================================================
# Agriculture Models
# ============================================================================

class CropAdvisory(AuditedModel):
    """Crop-specific flood advisories."""
    
    __tablename__ = "crop_advisories"
    __table_args__ = (
        Index("ix_crop_advisories_crop_type", "crop_type"),
        Index("ix_crop_advisories_status", "status"),
    )

    crop_type: Mapped[str] = mapped_column(String(100), nullable=False)  # rice, tea, rubber, etc.
    crop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    crop_name_si: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    crop_name_ta: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    status: Mapped[CropStatus] = mapped_column(
        SQLEnum(CropStatus, name="crop_status"),
        default=CropStatus.HEALTHY,
        nullable=False,
    )
    
    # Advisory content
    advisory_title: Mapped[str] = mapped_column(String(500), nullable=False)
    advisory_title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    advisory_title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    advisory_content: Mapped[str] = mapped_column(Text, nullable=False)
    advisory_content_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    advisory_content_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Actions
    recommended_actions: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # List of actions
    
    # Affected districts
    affected_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Validity
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Publication
    publication_status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class FarmDamageReport(AuditedModel):
    """Agricultural damage reports."""
    
    __tablename__ = "farm_damage_reports"
    __table_args__ = (
        Index("ix_farm_damage_reports_district_id", "district_id"),
        Index("ix_farm_damage_reports_status", "status"),
    )

    # Reporter
    farmer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    farmer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    farmer_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Location
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    location_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Damage details
    crop_type: Mapped[str] = mapped_column(String(100), nullable=False)
    area_affected_hectares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    damage_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_loss_lkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, verified, compensated
    
    # Verification
    verified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# ============================================================================
# Recovery Models
# ============================================================================

class RecoveryProgram(AuditedModel):
    """Recovery programs and initiatives."""
    
    __tablename__ = "recovery_programs"
    __table_args__ = (
        Index("ix_recovery_programs_category", "category"),
        Index("ix_recovery_programs_phase", "phase"),
        Index("ix_recovery_programs_status", "status"),
    )

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    name_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    description_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    category: Mapped[RecoveryCategory] = mapped_column(
        SQLEnum(RecoveryCategory, name="recovery_category"),
        nullable=False,
    )
    phase: Mapped[RecoveryPhase] = mapped_column(
        SQLEnum(RecoveryPhase, name="recovery_phase"),
        default=RecoveryPhase.ASSESSMENT,
        nullable=False,
    )
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Progress
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Budget
    budget_allocated_lkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    budget_spent_lkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Beneficiaries
    target_beneficiaries: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_beneficiaries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timeline
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Geographic scope
    target_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Contact
    coordinator_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    coordinator_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    coordinator_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class RecoveryMilestone(BaseModel):
    """Milestones for recovery programs."""
    
    __tablename__ = "recovery_milestones"
    __table_args__ = (
        Index("ix_recovery_milestones_program_id", "program_id"),
    )

    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recovery_programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class DonationCampaign(AuditedModel):
    """Donation and aid campaigns."""
    
    __tablename__ = "donation_campaigns"
    __table_args__ = (
        Index("ix_donation_campaigns_status", "status"),
    )

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    name_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Goals
    goal_amount_lkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    raised_amount_lkr: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    
    # Timeline
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Organization
    organizer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organizer_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Bank details (for transparency)
    bank_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


# ============================================================================
# Learn Hub Models
# ============================================================================

class LearnHubCategory(BaseModel):
    """Categories for learn hub content."""
    
    __tablename__ = "learn_hub_categories"
    __table_args__ = (
        Index("ix_learn_hub_categories_slug", "slug"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name_ta: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LearnHubArticle(AuditedModel):
    """Educational articles and guides."""
    
    __tablename__ = "learn_hub_articles"
    __table_args__ = (
        Index("ix_learn_hub_articles_category_id", "category_id"),
        Index("ix_learn_hub_articles_slug", "slug"),
        Index("ix_learn_hub_articles_status", "status"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_si: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_ta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Category
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learn_hub_categories.id"),
        nullable=True,
    )
    
    # Media
    featured_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    reading_time_mins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # beginner, intermediate, advanced
    
    # Tags
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Author
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    author_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Engagement
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # SEO
    meta_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Display
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LearnHubQuiz(AuditedModel):
    """Quizzes for learn hub content."""
    
    __tablename__ = "learn_hub_quizzes"
    __table_args__ = (
        Index("ix_learn_hub_quizzes_article_id", "article_id"),
    )

    article_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learn_hub_articles.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Questions stored as JSON
    questions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    # Settings
    passing_score_percent: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    time_limit_mins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ============================================================================
# Resource Models
# ============================================================================

class Resource(AuditedModel):
    """Downloadable resources and documents."""
    
    __tablename__ = "resources"
    __table_args__ = (
        Index("ix_resources_category", "category"),
        Index("ix_resources_status", "status"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # guide, form, checklist, video, etc.
    
    # File info
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, docx, mp4, etc.
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Metadata
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Engagement
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Display
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Checklist(AuditedModel):
    """Action checklists for emergency preparedness."""
    
    __tablename__ = "checklists"
    __table_args__ = (
        Index("ix_checklists_category", "category"),
        Index("ix_checklists_status", "status"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_si: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_ta: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # before_flood, during_flood, after_flood, etc.
    
    # Items stored as JSON array
    items: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    # Status
    status: Mapped[ContentStatus] = mapped_column(
        SQLEnum(ContentStatus, name="content_status"),
        default=ContentStatus.DRAFT,
        nullable=False,
    )
    
    # Display
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
