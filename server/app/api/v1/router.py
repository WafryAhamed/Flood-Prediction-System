"""
API v1 router - aggregates all domain routers.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.reports import router as reports_router
from app.api.v1.districts import router as districts_router, risk_zones_router
from app.api.v1.shelters import router as shelters_router, evacuation_router
from app.api.v1.broadcasts import (
    router as broadcasts_router,
    preferences_router,
    contacts_router,
    devices_router,
)
from app.api.v1.weather import router as weather_router


api_router = APIRouter()

# Authentication & Users
api_router.include_router(auth_router)
api_router.include_router(users_router)

# Citizen Reports
api_router.include_router(reports_router)

# GIS & Districts
api_router.include_router(districts_router)
api_router.include_router(risk_zones_router)

# Shelters & Evacuation
api_router.include_router(shelters_router)
api_router.include_router(evacuation_router)

# Broadcasts & Notifications
api_router.include_router(broadcasts_router)
api_router.include_router(preferences_router)
api_router.include_router(contacts_router)
api_router.include_router(devices_router)

# Weather
api_router.include_router(weather_router)
