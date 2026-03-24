"""Admin API module."""
from fastapi import APIRouter
from . import emergency_contacts, map_markers, audit_logs, system_config

router = APIRouter(prefix="/admin", tags=["Admin"])
router.include_router(emergency_contacts.router)
router.include_router(map_markers.router)
router.include_router(audit_logs.router)
router.include_router(system_config.router)

__all__ = ["router"]
