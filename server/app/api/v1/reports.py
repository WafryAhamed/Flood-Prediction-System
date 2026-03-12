"""
Citizen reports API routes.
"""
from typing import Annotated
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import CurrentUser, CurrentUserOptional, ModeratorUser
from app.models.reports import (
    CitizenReport,
    ReportType,
    ReportStatus,
    UrgencyLevel,
    ReportMedia,
    ReportUpvote,
    ReportEvent,
)
from app.models.gis import District
from app.schemas.reports import (
    ReportResponse,
    ReportDetailResponse,
    ReportCreateRequest,
    ReportUpdateRequest,
    ReportModerationRequest,
    ReportStatusUpdateRequest,
    ReportFilterParams,
    ReportStatsResponse,
    ReportListResponse,
)
from app.schemas.base import PaginatedResponse, MessageResponse
from app.core.security import generate_report_id


router = APIRouter(prefix="/reports", tags=["Citizen Reports"])


@router.get("", response_model=PaginatedResponse[ReportResponse])
async def list_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUserOptional = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    report_type: ReportType | None = None,
    status_filter: ReportStatus | None = Query(None, alias="status"),
    urgency: UrgencyLevel | None = None,
    district_id: UUID | None = None,
    verified_only: bool = Query(False),
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lon: float | None = None,
    max_lon: float | None = None,
    since: datetime | None = None,
):
    """
    List citizen reports with filtering.
    
    Public endpoint - returns only verified reports for unauthenticated users.
    """
    # Build base query
    query = select(CitizenReport).where(CitizenReport.deleted_at.is_(None))
    count_query = select(func.count(CitizenReport.id)).where(CitizenReport.deleted_at.is_(None))
    
    # For unauthenticated users or if verified_only, show only verified
    if _user is None or verified_only:
        query = query.where(CitizenReport.status == ReportStatus.VERIFIED)
        count_query = count_query.where(CitizenReport.status == ReportStatus.VERIFIED)
    
    # Apply filters
    if report_type:
        query = query.where(CitizenReport.report_type == report_type)
        count_query = count_query.where(CitizenReport.report_type == report_type)
    
    if status_filter:
        query = query.where(CitizenReport.status == status_filter)
        count_query = count_query.where(CitizenReport.status == status_filter)
    
    if urgency:
        query = query.where(CitizenReport.urgency_level == urgency)
        count_query = count_query.where(CitizenReport.urgency_level == urgency)
    
    if district_id:
        query = query.where(CitizenReport.district_id == district_id)
        count_query = count_query.where(CitizenReport.district_id == district_id)
    
    # Bounding box filter
    if all([min_lat, max_lat, min_lon, max_lon]):
        bbox_filter = and_(
            CitizenReport.latitude >= min_lat,
            CitizenReport.latitude <= max_lat,
            CitizenReport.longitude >= min_lon,
            CitizenReport.longitude <= max_lon,
        )
        query = query.where(bbox_filter)
        count_query = count_query.where(bbox_filter)
    
    if since:
        query = query.where(CitizenReport.created_at >= since)
        count_query = count_query.where(CitizenReport.created_at >= since)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination and ordering
    query = query.order_by(CitizenReport.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(CitizenReport.media))
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return PaginatedResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/my", response_model=PaginatedResponse[ReportResponse])
async def list_my_reports(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List reports submitted by the current user."""
    query = (
        select(CitizenReport)
        .where(
            CitizenReport.reporter_id == current_user.id,
            CitizenReport.deleted_at.is_(None),
        )
        .order_by(CitizenReport.created_at.desc())
    )
    
    count_query = select(func.count(CitizenReport.id)).where(
        CitizenReport.reporter_id == current_user.id,
        CitizenReport.deleted_at.is_(None),
    )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(CitizenReport.media))
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return PaginatedResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=ReportStatsResponse)
async def get_report_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    since: datetime | None = None,
):
    """Get report statistics."""
    base_filter = [CitizenReport.deleted_at.is_(None)]
    
    if district_id:
        base_filter.append(CitizenReport.district_id == district_id)
    
    if since:
        base_filter.append(CitizenReport.created_at >= since)
    
    # Total reports
    total_query = select(func.count(CitizenReport.id)).where(*base_filter)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    # By status
    status_query = (
        select(CitizenReport.status, func.count(CitizenReport.id))
        .where(*base_filter)
        .group_by(CitizenReport.status)
    )
    status_result = await db.execute(status_query)
    by_status = {str(row[0].value): row[1] for row in status_result.all()}
    
    # By type
    type_query = (
        select(CitizenReport.report_type, func.count(CitizenReport.id))
        .where(*base_filter)
        .group_by(CitizenReport.report_type)
    )
    type_result = await db.execute(type_query)
    by_type = {str(row[0].value): row[1] for row in type_result.all()}
    
    # By urgency
    urgency_query = (
        select(CitizenReport.urgency_level, func.count(CitizenReport.id))
        .where(*base_filter)
        .group_by(CitizenReport.urgency_level)
    )
    urgency_result = await db.execute(urgency_query)
    by_urgency = {str(row[0].value): row[1] for row in urgency_result.all()}
    
    return ReportStatsResponse(
        total_reports=total,
        by_status=by_status,
        by_type=by_type,
        by_urgency=by_urgency,
        pending_count=by_status.get("pending", 0),
        verified_count=by_status.get("verified", 0),
    )


@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUserOptional = None,
):
    """Get a specific report by ID."""
    # Support both UUID and report_id formats
    query = select(CitizenReport).where(CitizenReport.deleted_at.is_(None))
    
    try:
        uuid_id = UUID(report_id)
        query = query.where(CitizenReport.id == uuid_id)
    except ValueError:
        query = query.where(CitizenReport.report_id == report_id)
    
    query = query.options(
        selectinload(CitizenReport.media),
        selectinload(CitizenReport.events),
    )
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Non-verified reports require authentication
    if report.status == ReportStatus.PENDING and _user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view pending reports",
        )
    
    return ReportDetailResponse.model_validate(report)


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a new citizen report."""
    # Auto-detect district from coordinates (simplified - should use PostGIS ST_Contains)
    district_id = data.district_id
    if district_id is None and data.latitude and data.longitude:
        # In production, use spatial query to find containing district
        pass
    
    report = CitizenReport(
        report_id=generate_report_id(),
        reporter_id=current_user.id,
        report_type=data.report_type,
        title=data.title,
        description=data.description,
        description_si=data.description_si,
        description_ta=data.description_ta,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        district_id=district_id,
        urgency_level=data.urgency_level or UrgencyLevel.MEDIUM,
        people_affected=data.people_affected,
        contact_phone=data.contact_phone,
        is_anonymous=data.is_anonymous,
        status=ReportStatus.PENDING,
    )
    
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # Create initial event
    event = ReportEvent(
        report_id=report.id,
        event_type="submitted",
        description="Report submitted",
        actor_id=current_user.id,
    )
    db.add(event)
    await db.commit()
    
    return ReportResponse.model_validate(report)


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    data: ReportUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a report (only by reporter, only while pending)."""
    query = (
        select(CitizenReport)
        .where(
            CitizenReport.id == report_id,
            CitizenReport.deleted_at.is_(None),
        )
    )
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Only reporter can edit
    if report.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own reports",
        )
    
    # Only pending reports can be edited
    if report.status != ReportStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending reports can be edited",
        )
    
    # Apply updates
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/upvote", response_model=MessageResponse)
async def upvote_report(
    report_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Upvote a report to increase its visibility."""
    # Check report exists
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.deleted_at.is_(None),
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Check if already upvoted
    existing = await db.execute(
        select(ReportUpvote).where(
            ReportUpvote.report_id == report_id,
            ReportUpvote.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already upvoted this report",
        )
    
    # Create upvote
    upvote = ReportUpvote(
        report_id=report_id,
        user_id=current_user.id,
    )
    db.add(upvote)
    
    # Increment counter
    report.upvote_count += 1
    
    await db.commit()
    
    return MessageResponse(message="Report upvoted", success=True)


@router.delete("/{report_id}/upvote", response_model=MessageResponse)
async def remove_upvote(
    report_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Remove your upvote from a report."""
    # Find upvote
    query = select(ReportUpvote).where(
        ReportUpvote.report_id == report_id,
        ReportUpvote.user_id == current_user.id,
    )
    result = await db.execute(query)
    upvote = result.scalar_one_or_none()
    
    if upvote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upvote not found",
        )
    
    # Find report to decrement counter
    report_result = await db.execute(
        select(CitizenReport).where(CitizenReport.id == report_id)
    )
    report = report_result.scalar_one_or_none()
    
    if report:
        report.upvote_count = max(0, report.upvote_count - 1)
    
    await db.delete(upvote)
    await db.commit()
    
    return MessageResponse(message="Upvote removed", success=True)


@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(
    report_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a report (soft delete, only by reporter)."""
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.deleted_at.is_(None),
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Only reporter can delete
    if report.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reports",
        )
    
    # Soft delete
    report.deleted_at = datetime.utcnow()
    await db.commit()
    
    return MessageResponse(message="Report deleted", success=True)


# --- Moderation endpoints (require moderator role) ---

@router.post("/{report_id}/verify", response_model=ReportResponse)
async def verify_report(
    report_id: UUID,
    data: ReportModerationRequest,
    moderator: ModeratorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify a pending report (moderator only)."""
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.status == ReportStatus.PENDING,
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending report not found",
        )
    
    report.status = ReportStatus.VERIFIED
    report.verified_by_id = moderator.id
    report.verified_at = datetime.utcnow()
    report.moderator_notes = data.notes
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="verified",
        description=f"Report verified by {moderator.full_name}",
        actor_id=moderator.id,
        metadata={"notes": data.notes} if data.notes else None,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/reject", response_model=ReportResponse)
async def reject_report(
    report_id: UUID,
    data: ReportModerationRequest,
    moderator: ModeratorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reject a pending report (moderator only)."""
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.status == ReportStatus.PENDING,
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending report not found",
        )
    
    if not data.notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )
    
    report.status = ReportStatus.REJECTED
    report.verified_by_id = moderator.id
    report.verified_at = datetime.utcnow()
    report.moderator_notes = data.notes
    report.rejection_reason = data.notes
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="rejected",
        description=f"Report rejected: {data.notes}",
        actor_id=moderator.id,
        metadata={"reason": data.notes},
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/dispatch", response_model=ReportResponse)
async def dispatch_report(
    report_id: UUID,
    data: ReportStatusUpdateRequest,
    moderator: ModeratorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark report as dispatched to field teams (moderator only)."""
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.status == ReportStatus.VERIFIED,
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verified report not found",
        )
    
    report.status = ReportStatus.DISPATCHED
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="dispatched",
        description=f"Report dispatched by {moderator.full_name}",
        actor_id=moderator.id,
        metadata=data.metadata,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/resolve", response_model=ReportResponse)
async def resolve_report(
    report_id: UUID,
    data: ReportStatusUpdateRequest,
    moderator: ModeratorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark report as resolved (moderator only)."""
    query = select(CitizenReport).where(
        CitizenReport.id == report_id,
        CitizenReport.status.in_([ReportStatus.VERIFIED, ReportStatus.DISPATCHED]),
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or cannot be resolved",
        )
    
    report.status = ReportStatus.RESOLVED
    report.resolved_at = datetime.utcnow()
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="resolved",
        description=f"Report resolved by {moderator.full_name}",
        actor_id=moderator.id,
        metadata=data.metadata,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)
