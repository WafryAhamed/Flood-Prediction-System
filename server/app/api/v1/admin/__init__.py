"""Admin API module."""
from fastapi import APIRouter
from . import emergency_contacts, map_markers

router = APIRouter(prefix="/admin", tags=["Admin"])
router.include_router(emergency_contacts.router)
router.include_router(map_markers.router)

__all__ = ["router"]
