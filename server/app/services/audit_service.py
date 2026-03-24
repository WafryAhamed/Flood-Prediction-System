"""
Audit logging service for tracking admin actions.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory
from app.models.audit import AuditLog, AuditAction


class AuditService:
    """
    Centralized audit logging for admin actions.
    
    Every critical admin action (user management, settings changes,
    emergency contact CRUD, map marker CRUD, report moderation)
    should be logged via this service.
    """

    @staticmethod
    async def log_action(
        action: AuditAction,
        resource_type: str,
        *,
        user_id: Optional[UUID] = None,
        user_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        description: Optional[str] = None,
        old_values: Optional[dict[str, Any]] = None,
        new_values: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_path: Optional[str] = None,
        request_method: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        db: Optional[AsyncSession] = None,
    ) -> None:
        """
        Write an audit log entry. If no db session is provided,
        creates a new one (fire-and-forget safe).
        """
        should_close = db is None
        if db is None:
            db = async_session_factory()

        try:
            entry = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                description=description,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent,
                request_path=request_path,
                request_method=request_method,
                metadata_json=metadata,
                performed_at=datetime.now(timezone.utc),
            )
            db.add(entry)
            await db.commit()
        except Exception as e:
            # Audit logging should never break the main flow
            print(f"[AuditService] Failed to log action: {e}")
            try:
                await db.rollback()
            except Exception:
                pass
        finally:
            if should_close:
                await db.close()

    @staticmethod
    async def log_admin_action(
        action: AuditAction,
        resource_type: str,
        admin_user: Any,
        *,
        resource_id: Optional[str] = None,
        description: Optional[str] = None,
        old_values: Optional[dict[str, Any]] = None,
        new_values: Optional[dict[str, Any]] = None,
        request: Optional[Any] = None,
        db: Optional[AsyncSession] = None,
    ) -> None:
        """
        Convenience wrapper that extracts user info and request context.
        """
        ip_address = None
        user_agent_str = None
        request_path = None
        request_method = None

        if request is not None:
            ip_address = getattr(request, "client", None)
            if ip_address is not None:
                ip_address = ip_address.host
            headers = getattr(request, "headers", {})
            user_agent_str = headers.get("user-agent")
            request_path = str(getattr(request, "url", ""))
            request_method = getattr(request, "method", None)

        await AuditService.log_action(
            action=action,
            resource_type=resource_type,
            user_id=getattr(admin_user, "id", None),
            user_email=getattr(admin_user, "email", None),
            resource_id=resource_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent_str,
            request_path=request_path,
            request_method=request_method,
            db=db,
        )


# Singleton-style access
audit_service = AuditService()
