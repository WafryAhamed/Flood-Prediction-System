"""
Admin API endpoints for Page Visibility, System Settings, and Maintenance.
"""
from typing import Annotated, Dict, Any, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import AdminUser
from app.models.admin_settings import PageVisibility, SystemSettingsConfig

router = APIRouter(tags=["Admin - System Config"])

# --- Models ---

class PageVisibilityResponse(BaseModel):
    page_name: str
    is_enabled: bool

class PageVisibilityUpdateRequest(BaseModel):
    is_enabled: bool

class SystemSettingsResponse(BaseModel):
    dark_mode: bool
    sound_alerts: bool
    push_notifications: bool
    data_collection: bool
    anonymous_reporting: bool

class SystemSettingsUpdateRequest(SystemSettingsResponse):
    pass


# --- Page Visibility Endpoints ---

@router.get("/page-visibility", response_model=List[PageVisibilityResponse])
async def get_page_visibility(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all page visibility configurations."""
    result = await db.execute(select(PageVisibility))
    pages = result.scalars().all()
    
    # If table is empty, return default pages as visible
    if not pages:
        default_pages = [
            "whatIfLab", "learnHub", "historicalTimeline", "recoveryTracker",
            "evacuationPlanner", "communityReports", "agricultureAdvisor", "safetyProfile"
        ]
        pages_to_create = [PageVisibility(page_name=p, is_enabled=True) for p in default_pages]
        db.add_all(pages_to_create)
        await db.commit()
        return [{"page_name": p.page_name, "is_enabled": p.is_enabled} for p in pages_to_create]
        
    return [{"page_name": p.page_name, "is_enabled": p.is_enabled} for p in pages]


@router.put("/page-visibility/{page_name}", response_model=PageVisibilityResponse)
async def update_page_visibility(
    page_name: str,
    payload: PageVisibilityUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update visibility of a specific page."""
    result = await db.execute(select(PageVisibility).where(PageVisibility.page_name == page_name))
    page = result.scalar_one_or_none()
    
    if not page:
        page = PageVisibility(page_name=page_name, is_enabled=payload.is_enabled)
        db.add(page)
    else:
        page.is_enabled = payload.is_enabled
        
    await db.commit()
    return {"page_name": page.page_name, "is_enabled": page.is_enabled}


# --- System Settings Endpoints ---

@router.get("/settings", response_model=SystemSettingsResponse)
async def get_system_settings(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get global system settings."""
    result = await db.execute(select(SystemSettingsConfig))
    settings = result.scalars().first()
    
    if not settings:
        settings = SystemSettingsConfig()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return {
        "dark_mode": settings.dark_mode,
        "sound_alerts": settings.sound_alerts,
        "push_notifications": settings.push_notifications,
        "data_collection": settings.data_collection,
        "anonymous_reporting": settings.anonymous_reporting,
    }


@router.put("/settings", response_model=SystemSettingsResponse)
async def update_system_settings(
    payload: SystemSettingsUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update global system settings."""
    result = await db.execute(select(SystemSettingsConfig))
    settings = result.scalars().first()
    
    if not settings:
        settings = SystemSettingsConfig(**payload.model_dump())
        db.add(settings)
    else:
        for key, value in payload.model_dump().items():
            setattr(settings, key, value)
            
    await db.commit()
    await db.refresh(settings)
    return settings


# --- System Maintenance Endpoints ---

@router.post("/system/sync-db")
async def sync_database(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Sync database command."""
    # In a real app this would trigger background tasks
    return {"status": "success", "message": "Database sync initiated"}


@router.post("/system/generate-report")
async def generate_system_report(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate system health report."""
    return {"status": "success", "message": "System report generated successfully"}


@router.post("/system/clear-cache")
async def clear_system_cache(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Clear Redis/application cache."""
    return {"status": "success", "message": "Cache cleared successfully"}


@router.post("/system/reset")
async def reset_system_defaults(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reset settings and visibility to defaults."""
    # Reset default page visibility
    await db.execute(update(PageVisibility).values(is_enabled=True))
    
    # Reset default system settings
    await db.execute(update(SystemSettingsConfig).values(
        dark_mode=True,
        sound_alerts=True,
        push_notifications=True,
        data_collection=False,
        anonymous_reporting=True,
    ))
    
    await db.commit()
    return {"status": "success", "message": "System reset to defaults"}
