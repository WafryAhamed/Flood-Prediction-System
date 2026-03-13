"""
API v1 router - aggregates all domain routers.
"""
import logging
from importlib import import_module

from fastapi import APIRouter
from app.api.v1.integration import router as integration_router


api_router = APIRouter()
logger = logging.getLogger(__name__)


def _include_module_routers(module_path: str, router_names: list[str]) -> None:
    """Attempt to include routers from a module without crashing startup."""
    try:
        module = import_module(module_path)
    except Exception as exc:
        logger.warning("Skipping router module %s due to import error: %s", module_path, exc)
        return

    for router_name in router_names:
        router = getattr(module, router_name, None)
        if isinstance(router, APIRouter):
            api_router.include_router(router)
        else:
            logger.warning(
                "Router '%s' missing or invalid in module %s",
                router_name,
                module_path,
            )

# Authentication & Users
_include_module_routers("app.api.v1.auth", ["router"])
_include_module_routers("app.api.v1.users", ["router"])

# Citizen Reports
_include_module_routers("app.api.v1.reports", ["router"])

# GIS & Districts
_include_module_routers("app.api.v1.districts", ["router", "risk_zones_router"])

# Shelters & Evacuation
_include_module_routers("app.api.v1.shelters", ["router", "evacuation_router"])

# Broadcasts & Notifications
_include_module_routers(
    "app.api.v1.broadcasts",
    ["router", "preferences_router", "contacts_router", "devices_router"],
)

# Weather
_include_module_routers("app.api.v1.weather", ["router"])

# Frontend Integration
api_router.include_router(integration_router)
