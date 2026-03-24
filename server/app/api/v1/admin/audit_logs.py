"""Admin audit logs API endpoint."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.audit import AuditLog, DataUploadJob
from app.api.deps import AdminUser

router = APIRouter()


@router.get("/audit-logs")
async def list_audit_logs(
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
) -> dict[str, Any]:
    """Return paginated audit logs for the admin dashboard."""
    query = select(AuditLog).order_by(desc(AuditLog.performed_at))

    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()

    items = []
    for log in logs:
        items.append({
            "id": str(log.id),
            "user_email": log.user_email or "System",
            "action": log.action.value if log.action else "unknown",
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "description": log.description,
            "ip_address": str(log.ip_address) if log.ip_address else None,
            "performed_at": log.performed_at.isoformat() if log.performed_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/upload-jobs")
async def list_upload_jobs(
    _admin: AdminUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Return upload job history for the data upload page."""
    query = select(DataUploadJob).order_by(desc(DataUploadJob.created_at))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    jobs = result.scalars().all()

    items = []
    for job in jobs:
        items.append({
            "id": str(job.id),
            "upload_type": job.upload_type,
            "file_name": job.file_name,
            "file_size_bytes": job.file_size_bytes,
            "status": job.status.value if job.status else "unknown",
            "total_records": job.total_records,
            "processed_records": job.processed_records,
            "success_count": job.success_count,
            "error_count": job.error_count,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
