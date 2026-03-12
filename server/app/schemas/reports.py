"""
Citizen report schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import Field
from uuid import UUID

from app.schemas.base import BaseSchema, IDSchema, GeoPointSchema
from app.models.reports import ReportType, ReportStatus, UrgencyLevel, MediaType


# ============================================================================
# Report Media Schemas
# ============================================================================

class ReportMediaResponse(IDSchema):
    """Report media response schema."""
    
    media_type: MediaType
    file_url: str
    thumbnail_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[int] = None
    ai_caption: Optional[str] = None


# ============================================================================
# Report Event Schemas
# ============================================================================

class ReportEventResponse(IDSchema):
    """Report event response schema."""
    
    event_type: str
    event_at: datetime
    actor_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# Report Schemas
# ============================================================================

class ReportBase(BaseSchema):
    """Base report schema."""
    
    report_type: ReportType
    title: str = Field(min_length=5, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)


class ReportCreate(ReportBase):
    """Report creation schema (citizen submission)."""
    
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    location_description: Optional[str] = Field(default=None, max_length=500)
    district_code: Optional[str] = None
    reporter_name: Optional[str] = Field(default=None, max_length=255)
    reporter_phone: Optional[str] = Field(default=None, max_length=50)
    is_anonymous: bool = False
    people_affected: Optional[int] = Field(default=None, ge=0)
    media_ids: List[UUID] = []  # Pre-uploaded media IDs


class ReportUpdate(BaseSchema):
    """Report update schema (by reporter)."""
    
    title: Optional[str] = Field(default=None, min_length=5, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    location_description: Optional[str] = Field(default=None, max_length=500)
    people_affected: Optional[int] = Field(default=None, ge=0)


class ReportModerationAction(BaseSchema):
    """Report moderation action schema."""
    
    action: str = Field(pattern="^(verify|reject|dispatch|resolve)$")
    notes: Optional[str] = Field(default=None, max_length=2000)
    urgency: Optional[UrgencyLevel] = None
    response_team: Optional[str] = None  # For dispatch action


class ReportResponse(ReportBase, IDSchema):
    """Report response schema."""
    
    public_id: str
    status: ReportStatus
    urgency: UrgencyLevel
    urgency_score: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    district_id: Optional[UUID] = None
    submitted_at: datetime
    verified_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    reporter_name: Optional[str] = None
    is_anonymous: bool
    people_affected: Optional[int] = None
    ai_verification_score: Optional[float] = None
    source_trust_score: float
    is_public: bool
    is_featured: bool
    upvote_count: int = 0
    media: List[ReportMediaResponse] = []


class ReportDetailResponse(ReportResponse):
    """Detailed report response with events."""
    
    reporter_phone: Optional[str] = None  # Only for authorized users
    moderator_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    dispatch_notes: Optional[str] = None
    response_team: Optional[str] = None
    resolution_notes: Optional[str] = None
    events: List[ReportEventResponse] = []


class ReportListItem(BaseSchema):
    """Minimal report for list views."""
    
    id: UUID
    public_id: str
    report_type: ReportType
    title: str
    status: ReportStatus
    urgency: UrgencyLevel
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district_id: Optional[UUID] = None
    submitted_at: datetime
    is_anonymous: bool
    upvote_count: int = 0
    has_media: bool = False


class ReportListResponse(BaseSchema):
    """Paginated report list response."""
    
    reports: List[ReportListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================================================
# Report Filter/Search Schemas
# ============================================================================

class ReportFilter(BaseSchema):
    """Report filter parameters."""
    
    status: Optional[ReportStatus] = None
    statuses: Optional[List[ReportStatus]] = None
    report_type: Optional[ReportType] = None
    report_types: Optional[List[ReportType]] = None
    urgency: Optional[UrgencyLevel] = None
    urgencies: Optional[List[UrgencyLevel]] = None
    district_id: Optional[UUID] = None
    district_ids: Optional[List[UUID]] = None
    reporter_id: Optional[UUID] = None
    is_anonymous: Optional[bool] = None
    is_featured: Optional[bool] = None
    min_urgency_score: Optional[int] = Field(default=None, ge=0, le=100)
    submitted_after: Optional[datetime] = None
    submitted_before: Optional[datetime] = None
    search: Optional[str] = None  # Full-text search


# ============================================================================
# Report Statistics Schemas
# ============================================================================

class ReportStatsByStatus(BaseSchema):
    """Report counts by status."""
    
    pending: int = 0
    verified: int = 0
    rejected: int = 0
    dispatched: int = 0
    resolved: int = 0


class ReportStatsByType(BaseSchema):
    """Report counts by type."""
    
    flood: int = 0
    road_blocked: int = 0
    landslide: int = 0
    power_outage: int = 0
    rescue_needed: int = 0
    other: int = 0


class ReportDashboardStats(BaseSchema):
    """Dashboard statistics for reports."""
    
    total_reports: int
    reports_today: int
    by_status: ReportStatsByStatus
    by_type: ReportStatsByType
    avg_resolution_time_hours: Optional[float] = None
    pending_high_urgency: int = 0
