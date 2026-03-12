"""
Authentication-related background tasks.
"""
import logging
from datetime import datetime

from celery import shared_task

from app.db.session import async_session_maker


logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_sessions() -> dict:
    """
    Clean up expired refresh tokens and admin sessions.
    
    Runs hourly to:
    - Delete expired refresh tokens
    - Clean up inactive admin sessions
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_cleanup_sessions_async())


async def _cleanup_sessions_async() -> dict:
    """Async implementation of session cleanup."""
    from sqlalchemy import delete
    from app.models.auth import RefreshToken, AdminSession
    
    async with async_session_maker() as db:
        now = datetime.utcnow()
        
        # Delete expired refresh tokens
        token_delete = delete(RefreshToken).where(RefreshToken.expires_at < now)
        token_result = await db.execute(token_delete)
        tokens_deleted = token_result.rowcount
        
        # Mark old admin sessions as inactive
        # (sessions older than 24 hours without activity)
        from datetime import timedelta
        cutoff = now - timedelta(hours=24)
        
        from sqlalchemy import update
        session_update = (
            update(AdminSession)
            .where(
                AdminSession.is_active == True,
                AdminSession.last_active_at < cutoff,
            )
            .values(is_active=False)
        )
        session_result = await db.execute(session_update)
        sessions_deactivated = session_result.rowcount
        
        await db.commit()
        
        logger.info(
            f"Cleanup: {tokens_deleted} tokens deleted, "
            f"{sessions_deactivated} sessions deactivated"
        )
        
        return {
            "tokens_deleted": tokens_deleted,
            "sessions_deactivated": sessions_deactivated,
        }


@shared_task
def record_login_anomaly(user_id: str, ip_address: str, reason: str) -> dict:
    """
    Record suspicious login activity for security monitoring.
    """
    import asyncio
    return asyncio.get_event_loop().run_until_complete(
        _record_anomaly_async(user_id, ip_address, reason)
    )


async def _record_anomaly_async(user_id: str, ip_address: str, reason: str) -> dict:
    """Async implementation of anomaly recording."""
    from uuid import UUID
    from app.models.audit import AuditLog, AuditAction
    
    async with async_session_maker() as db:
        log = AuditLog(
            user_id=UUID(user_id) if user_id else None,
            action=AuditAction.AUTH_ATTEMPT,
            resource_type="user",
            resource_id=user_id,
            ip_address=ip_address,
            details={
                "anomaly_type": reason,
                "flagged_for_review": True,
            },
        )
        db.add(log)
        await db.commit()
        
        return {"recorded": True, "reason": reason}
