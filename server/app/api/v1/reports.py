"""
Citizen reports API routes.
"""
import logging
from math import ceil
from typing import Annotated, Any
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import CurrentUser, CurrentUserOptional, ModeratorUser
from app.models.reports import (
    CitizenReport,
    ReportType,
    ReportStatus,
    UrgencyLevel,
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
    ReportStatsResponse,
    ReportStatsByStatus,
    ReportStatsByType,
)
from app.schemas.base import PaginatedResponse, MessageResponse
from app.core.security import generate_report_id


router = APIRouter(prefix="/reports", tags=["Citizen Reports"])
logger = logging.getLogger(__name__)


def _build_paginated_response(items: list[ReportResponse], total: int, page: int, page_size: int) -> PaginatedResponse[ReportResponse]:
    total_pages = max(1, ceil(total / page_size)) if total else 1
    return PaginatedResponse[ReportResponse](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


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
    query = select(CitizenReport).where(CitizenReport.is_deleted.is_(False))
    count_query = select(func.count(CitizenReport.id)).where(CitizenReport.is_deleted.is_(False))
    
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
        query = query.where(CitizenReport.urgency == urgency)
        count_query = count_query.where(CitizenReport.urgency == urgency)
    
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
        query = query.where(CitizenReport.submitted_at >= since)
        count_query = count_query.where(CitizenReport.submitted_at >= since)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination and ordering
    query = query.order_by(CitizenReport.submitted_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(CitizenReport.media), selectinload(CitizenReport.upvotes))
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return _build_paginated_response(
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
            CitizenReport.is_deleted.is_(False),
        )
        .order_by(CitizenReport.submitted_at.desc())
    )
    
    count_query = select(func.count(CitizenReport.id)).where(
        CitizenReport.reporter_id == current_user.id,
        CitizenReport.is_deleted.is_(False),
    )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.options(selectinload(CitizenReport.media), selectinload(CitizenReport.upvotes))
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return _build_paginated_response(
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
    base_filter: list[Any] = [CitizenReport.is_deleted.is_(False)]
    
    if district_id:
        base_filter.append(CitizenReport.district_id == district_id)
    
    if since:
        base_filter.append(CitizenReport.submitted_at >= since)
    
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
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_query = select(func.count(CitizenReport.id)).where(*base_filter, CitizenReport.submitted_at >= today_start)
    today_result = await db.execute(today_query)
    reports_today = today_result.scalar() or 0

    avg_resolution_query = select(
        func.avg(func.extract("epoch", CitizenReport.resolved_at - CitizenReport.submitted_at)) / 3600.0
    ).where(
        *base_filter,
        CitizenReport.resolved_at.is_not(None),
    )
    avg_resolution_result = await db.execute(avg_resolution_query)
    avg_resolution_time_hours = avg_resolution_result.scalar()

    pending_high_query = select(func.count(CitizenReport.id)).where(
        *base_filter,
        CitizenReport.status == ReportStatus.PENDING,
        CitizenReport.urgency.in_([UrgencyLevel.CRITICAL, UrgencyLevel.HIGH]),
    )
    pending_high_result = await db.execute(pending_high_query)
    pending_high_urgency = pending_high_result.scalar() or 0

    by_status_payload = ReportStatsByStatus(
        pending=by_status.get("pending", 0),
        verified=by_status.get("verified", 0),
        rejected=by_status.get("rejected", 0),
        dispatched=by_status.get("dispatched", 0),
        resolved=by_status.get("resolved", 0),
    )

    by_type_payload = ReportStatsByType(
        flood=by_type.get("flood", 0),
        road_blocked=by_type.get("road_blocked", 0),
        landslide=by_type.get("landslide", 0),
        power_outage=by_type.get("power_outage", 0),
        rescue_needed=by_type.get("rescue_needed", 0),
        other=by_type.get("other", 0),
    )
    
    return ReportStatsResponse(
        total_reports=total,
        reports_today=reports_today,
        by_status=by_status_payload,
        by_type=by_type_payload,
        avg_resolution_time_hours=float(avg_resolution_time_hours) if avg_resolution_time_hours is not None else None,
        pending_high_urgency=pending_high_urgency,
    )


@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUserOptional = None,
):
    """Get a specific report by ID."""
    # Support both UUID and report_id formats
    query = select(CitizenReport).where(CitizenReport.is_deleted.is_(False))
    
    try:
        uuid_id = UUID(report_id)
        query = query.where(CitizenReport.id == uuid_id)
    except ValueError:
        query = query.where(CitizenReport.public_id == report_id)
    
    query = query.options(
        selectinload(CitizenReport.media),
        selectinload(CitizenReport.events),
        selectinload(CitizenReport.upvotes),
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
    if district_id is None and data.district_code:
        district_result = await db.execute(
            select(District.id).where(District.code == data.district_code)
        )
        district_id = district_result.scalar_one_or_none()
    
    report = CitizenReport(
        public_id=generate_report_id(),
        reporter_id=current_user.id,
        report_type=data.report_type,
        title=data.title,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        location_description=data.location_description,
        district_id=district_id,
        urgency=data.urgency or UrgencyLevel.MEDIUM,
        people_affected=data.people_affected,
        reporter_name=None if data.is_anonymous else (data.reporter_name or current_user.full_name),
        reporter_phone=data.reporter_phone or current_user.phone,
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
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        notes="Report submitted",
    )
    db.add(event)
    await db.commit()

    logger.info("Citizen report created", extra={"report_id": str(report.public_id), "user_id": str(current_user.id)})
    
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
            CitizenReport.is_deleted.is_(False),
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

    logger.info("Citizen report updated", extra={"report_id": str(report.public_id), "user_id": str(current_user.id)})
    
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
        CitizenReport.is_deleted.is_(False),
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
    
    await db.commit()

    logger.info("Citizen report upvoted", extra={"report_id": str(report.public_id), "user_id": str(current_user.id)})
    
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
    
    await db.delete(upvote)
    await db.commit()

    if report is not None:
        logger.info("Citizen report upvote removed", extra={"report_id": str(report.public_id), "user_id": str(current_user.id)})
    
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
        CitizenReport.is_deleted.is_(False),
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
    report.is_deleted = True
    report.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info("Citizen report deleted", extra={"report_id": str(report.public_id), "user_id": str(current_user.id)})
    
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
    report.moderator_id = moderator.id
    report.verified_at = datetime.now(timezone.utc)
    report.moderator_notes = data.notes
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="verified",
        actor_id=moderator.id,
        actor_name=moderator.full_name,
        old_value=ReportStatus.PENDING.value,
        new_value=ReportStatus.VERIFIED.value,
        notes=data.notes or f"Report verified by {moderator.full_name}",
        metadata_json={"notes": data.notes} if data.notes else None,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)

    logger.info("Citizen report verified", extra={"report_id": str(report.public_id), "moderator_id": str(moderator.id)})
    
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
    report.moderator_id = moderator.id
    report.verified_at = datetime.now(timezone.utc)
    report.moderator_notes = data.notes
    report.rejection_reason = data.notes
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="rejected",
        actor_id=moderator.id,
        actor_name=moderator.full_name,
        old_value=ReportStatus.PENDING.value,
        new_value=ReportStatus.REJECTED.value,
        notes=data.notes,
        metadata_json={"reason": data.notes},
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)

    logger.info("Citizen report rejected", extra={"report_id": str(report.public_id), "moderator_id": str(moderator.id)})
    
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
    
    previous_status = report.status
    report.status = ReportStatus.DISPATCHED
    report.dispatched_at = datetime.now(timezone.utc)
    report.dispatch_notes = data.notes
    report.response_team = data.response_team
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="dispatched",
        actor_id=moderator.id,
        actor_name=moderator.full_name,
        old_value=previous_status.value,
        new_value=ReportStatus.DISPATCHED.value,
        notes=data.notes or f"Report dispatched by {moderator.full_name}",
        metadata_json=data.metadata,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)

    logger.info("Citizen report dispatched", extra={"report_id": str(report.public_id), "moderator_id": str(moderator.id)})
    
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
    
    previous_status = report.status
    report.status = ReportStatus.RESOLVED
    report.resolved_at = datetime.now(timezone.utc)
    report.resolution_notes = data.notes
    
    # Create event
    event = ReportEvent(
        report_id=report.id,
        event_type="resolved",
        actor_id=moderator.id,
        actor_name=moderator.full_name,
        old_value=previous_status.value,
        new_value=ReportStatus.RESOLVED.value,
        notes=data.notes or f"Report resolved by {moderator.full_name}",
        metadata_json=data.metadata,
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(report)

    logger.info("Citizen report resolved", extra={"report_id": str(report.public_id), "moderator_id": str(moderator.id)})
    
    return ReportResponse.model_validate(report)
