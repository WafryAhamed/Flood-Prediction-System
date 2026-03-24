"""
Weather data API routes.
"""
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime, timedelta
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import CurrentUserOptional, AdminUser, OperatorUser, require_roles, get_current_user
from app.models.audit import SystemSetting
from app.services.integration_state import integration_state_service
from app.models.auth import UserRole, User
from app.models.weather import (
    WeatherObservation,
    WeatherForecast,
    WeatherSource,
    RadarSnapshot,
    RiverGaugeReading,
    WeatherAlert,
    AlertSeverity,
    AlertType,
    FloodPrediction,
)
from app.schemas.weather import (
    WeatherObservationResponse,
    WeatherForecastResponse,
    RadarSnapshotResponse,
    RiverGaugeReadingResponse,
    WeatherAlertResponse,
    WeatherAlertCreateRequest,
    FloodPredictionResponse,
    CurrentWeatherResponse,
)
from app.schemas.base import PaginatedResponse, MessageResponse


router = APIRouter(prefix="/weather", tags=["Weather Data"])


@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    lat: float | None = None,
    lon: float | None = None,
):
    """
    Get current weather conditions.
    
    Either district_id OR lat/lon coordinates should be provided.
    """
    # Get the most recent observation
    query = select(WeatherObservation)
    
    if district_id:
        query = query.where(WeatherObservation.district_id == district_id)
    elif lat and lon:
        # Find nearest station (simplified - in production use PostGIS)
        lat_delta = 0.5  # ~55km
        lon_delta = 0.5
        query = query.where(
            WeatherObservation.latitude.between(lat - lat_delta, lat + lat_delta),
            WeatherObservation.longitude.between(lon - lon_delta, lon + lon_delta),
        )
    
    query = query.order_by(WeatherObservation.observed_at.desc()).limit(1)
    
    result = await db.execute(query)
    observation = result.scalar_one_or_none()
    
    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No weather data available for the specified location",
        )
    
    return CurrentWeatherResponse.model_validate(observation)


@router.get("/observations", response_model=PaginatedResponse[WeatherObservationResponse])
async def list_weather_observations(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    district_id: UUID | None = None,
    source: WeatherSource | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
):
    """List weather observations with filtering."""
    query = select(WeatherObservation)
    count_query = select(func.count(WeatherObservation.id))
    
    if district_id:
        query = query.where(WeatherObservation.district_id == district_id)
        count_query = count_query.where(WeatherObservation.district_id == district_id)
    
    if source:
        query = query.where(WeatherObservation.source == source)
        count_query = count_query.where(WeatherObservation.source == source)
    
    if since:
        query = query.where(WeatherObservation.observed_at >= since)
        count_query = count_query.where(WeatherObservation.observed_at >= since)
    
    if until:
        query = query.where(WeatherObservation.observed_at <= until)
        count_query = count_query.where(WeatherObservation.observed_at <= until)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(WeatherObservation.observed_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    observations = result.scalars().all()
    
    return PaginatedResponse(
        items=[WeatherObservationResponse.model_validate(o) for o in observations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/forecasts", response_model=list[WeatherForecastResponse])
async def get_weather_forecasts(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    days: int = Query(7, ge=1, le=14),
):
    """Get weather forecasts for the next N days."""
    now = datetime.utcnow()
    end_date = now + timedelta(days=days)
    
    query = select(WeatherForecast).where(
        WeatherForecast.forecast_date.between(now.date(), end_date.date())
    )
    
    if district_id:
        query = query.where(WeatherForecast.district_id == district_id)
    
    query = query.order_by(WeatherForecast.forecast_date, WeatherForecast.district_id)
    
    result = await db.execute(query)
    forecasts = result.scalars().all()
    
    return [WeatherForecastResponse.model_validate(f) for f in forecasts]


@router.get("/forecasts/{district_id}", response_model=list[WeatherForecastResponse])
async def get_district_forecasts(
    district_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(7, ge=1, le=14),
):
    """Get weather forecasts for a specific district."""
    now = datetime.utcnow()
    end_date = now + timedelta(days=days)
    
    query = (
        select(WeatherForecast)
        .where(
            WeatherForecast.district_id == district_id,
            WeatherForecast.forecast_date.between(now.date(), end_date.date()),
        )
        .order_by(WeatherForecast.forecast_date)
    )
    
    result = await db.execute(query)
    forecasts = result.scalars().all()
    
    return [WeatherForecastResponse.model_validate(f) for f in forecasts]


@router.get("/radar", response_model=list[RadarSnapshotResponse])
async def get_radar_snapshots(
    db: Annotated[AsyncSession, Depends(get_db)],
    hours: int = Query(6, ge=1, le=24),
    limit: int = Query(12, ge=1, le=48),
):
    """Get recent radar snapshots for animation."""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    query = (
        select(RadarSnapshot)
        .where(RadarSnapshot.captured_at >= since)
        .order_by(RadarSnapshot.captured_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    snapshots = result.scalars().all()
    
    return [RadarSnapshotResponse.model_validate(s) for s in snapshots]


@router.get("/river-gauges", response_model=list[RiverGaugeReadingResponse])
async def get_river_gauge_readings(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    station_id: str | None = None,
    hours: int = Query(24, ge=1, le=168),
):
    """Get recent river gauge readings."""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    query = select(RiverGaugeReading).where(RiverGaugeReading.observed_at >= since)
    
    if district_id:
        query = query.where(RiverGaugeReading.district_id == district_id)
    
    if station_id:
        query = query.where(RiverGaugeReading.station_id == station_id)
    
    query = query.order_by(RiverGaugeReading.observed_at.desc())
    
    result = await db.execute(query)
    readings = result.scalars().all()
    
    return [RiverGaugeReadingResponse.model_validate(r) for r in readings]


@router.get("/river-gauges/stations", response_model=list[dict])
async def list_river_gauge_stations(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
):
    """List all river gauge stations."""
    query = select(
        RiverGaugeReading.station_id,
        RiverGaugeReading.station_name,
        RiverGaugeReading.river_name,
        RiverGaugeReading.district_id,
        RiverGaugeReading.latitude,
        RiverGaugeReading.longitude,
    ).distinct(RiverGaugeReading.station_id)
    
    if district_id:
        query = query.where(RiverGaugeReading.district_id == district_id)
    
    result = await db.execute(query)
    stations = result.all()
    
    return [
        {
            "station_id": row[0],
            "station_name": row[1],
            "river_name": row[2],
            "district_id": row[3],
            "latitude": row[4],
            "longitude": row[5],
        }
        for row in stations
    ]


# --- Weather Alerts ---

@router.get("/alerts", response_model=list[WeatherAlertResponse])
async def get_weather_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    severity: AlertSeverity | None = None,
    alert_type: AlertType | None = None,
    active_only: bool = Query(True),
):
    """Get weather alerts."""
    query = select(WeatherAlert)
    
    if active_only:
        now = datetime.utcnow()
        query = query.where(
            WeatherAlert.is_active == True,
            (WeatherAlert.expires_at.is_(None)) | (WeatherAlert.expires_at > now),
        )
    
    if district_id:
        query = query.where(WeatherAlert.district_id == district_id)
    
    if severity:
        query = query.where(WeatherAlert.severity == severity)
    
    if alert_type:
        query = query.where(WeatherAlert.alert_type == alert_type)
    
    query = query.order_by(WeatherAlert.severity.desc(), WeatherAlert.issued_at.desc())
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return [WeatherAlertResponse.model_validate(a) for a in alerts]


@router.get("/alerts/{alert_id}", response_model=WeatherAlertResponse)
async def get_weather_alert(
    alert_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific weather alert."""
    query = select(WeatherAlert).where(WeatherAlert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weather alert not found",
        )
    
    return WeatherAlertResponse.model_validate(alert)


@router.post("/alerts", response_model=WeatherAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_weather_alert(
    data: WeatherAlertCreateRequest,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new weather alert (operator and above)."""
    alert = WeatherAlert(
        district_id=data.district_id,
        alert_type=data.alert_type,
        severity=data.severity,
        headline_en=data.headline_en,
        headline_si=data.headline_si,
        headline_ta=data.headline_ta,
        description_en=data.description_en,
        description_si=data.description_si,
        description_ta=data.description_ta,
        instructions_en=data.instructions_en,
        instructions_si=data.instructions_si,
        instructions_ta=data.instructions_ta,
        issued_at=datetime.utcnow(),
        expires_at=data.expires_at,
        source=data.source or "manual",
        is_active=True,
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    return WeatherAlertResponse.model_validate(alert)


@router.post("/alerts/{alert_id}/cancel", response_model=WeatherAlertResponse)
async def cancel_weather_alert(
    alert_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Cancel a weather alert (operator and above)."""
    query = select(WeatherAlert).where(WeatherAlert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weather alert not found",
        )
    
    alert.is_active = False
    await db.commit()
    await db.refresh(alert)
    
    return WeatherAlertResponse.model_validate(alert)


# --- Flood Predictions ---

@router.get("/predictions", response_model=list[FloodPredictionResponse])
async def get_flood_predictions(
    db: Annotated[AsyncSession, Depends(get_db)],
    district_id: UUID | None = None,
    zone_id: UUID | None = None,
    min_probability: float = Query(0.0, ge=0, le=1),
    hours_ahead: int = Query(72, ge=1, le=168),
):
    """Get flood predictions."""
    now = datetime.utcnow()
    end_time = now + timedelta(hours=hours_ahead)
    
    query = select(FloodPrediction).where(
        FloodPrediction.predicted_for.between(now, end_time),
        FloodPrediction.probability >= min_probability,
    )
    
    if district_id:
        query = query.where(FloodPrediction.district_id == district_id)
    
    if zone_id:
        query = query.where(FloodPrediction.zone_id == zone_id)
    
    query = query.order_by(FloodPrediction.probability.desc(), FloodPrediction.predicted_for)
    
    result = await db.execute(query)
    predictions = result.scalars().all()
    
    return [FloodPredictionResponse.model_validate(p) for p in predictions]


@router.get("/predictions/summary", response_model=dict)
async def get_flood_prediction_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    hours_ahead: int = Query(24, ge=1, le=168),
):
    """Get a summary of flood predictions by district."""
    now = datetime.utcnow()
    end_time = now + timedelta(hours=hours_ahead)
    
    # Get max probability per district
    query = (
        select(
            FloodPrediction.district_id,
            func.max(FloodPrediction.probability).label("max_probability"),
            func.count(FloodPrediction.id).label("prediction_count"),
        )
        .where(FloodPrediction.predicted_for.between(now, end_time))
        .group_by(FloodPrediction.district_id)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    summary = {
        "time_range_hours": hours_ahead,
        "districts": [
            {
                "district_id": str(row[0]),
                "max_probability": row[1],
                "prediction_count": row[2],
            }
            for row in rows
        ],
        "high_risk_count": sum(1 for row in rows if row[1] >= 0.7),
        "moderate_risk_count": sum(1 for row in rows if 0.3 <= row[1] < 0.7),
    }
    
    return summary


# --- Weather Overrides (Admin Testing/Simulation) ---

class WeatherOverridesSchema(BaseModel):
    """Schema for weather override parameters"""
    wind_speed_kmh: Optional[float] = Field(None, ge=0, le=200, description="Wind speed in km/h")
    rainfall_mm: Optional[float] = Field(None, ge=0, le=500, description="Rainfall in millimeters")
    temperature_c: Optional[float] = Field(None, ge=-50, le=60, description="Temperature in Celsius")
    humidity_percent: Optional[float] = Field(None, ge=0, le=100, description="Humidity percentage")
    pressure_hpa: Optional[float] = Field(None, ge=800, le=1100, description="Pressure in hectopascals")
    visibility_km: Optional[float] = Field(None, ge=0, le=50, description="Visibility in kilometers")
    affected_districts: Optional[list[str]] = Field(None, description="List of affected district codes")
    active: bool = Field(True, description="Whether overrides are active")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wind_speed_kmh": 45.5,
                "rainfall_mm": 150.0,
                "temperature_c": 28.5,
                "humidity_percent": 85,
                "pressure_hpa": 1012,
                "visibility_km": 2.0,
                "affected_districts": ["CMB", "GAL"],
                "active": True
            }
        }


class WeatherOverridesResponse(BaseModel):
    """Response for weather override operations"""
    status: str
    active: bool
    affected_count: int
    updated_at: datetime
    overrides: dict


@router.get("/overrides", response_model=dict, tags=["Weather Overrides"])
async def get_weather_overrides(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Get current weather overrides (if active).
    
    This endpoint returns the current weather overrides that are active for testing/simulation.
    Returns empty response if no overrides are active.
    """
    query = select(SystemSetting).where(
        SystemSetting.key == "weather_overrides"
    )
    result = await db.execute(query)
    setting = result.scalar_one_or_none()
    
    if not setting:
        return {
            "active": False,
            "overrides": None,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    try:
        data = json.loads(setting.value)
        if data.get("active"):
            return {
                "active": True,
                "overrides": data,
                "timestamp": datetime.utcnow().isoformat()
            }
    except (json.JSONDecodeError, TypeError):
        pass
    
    return {
        "active": False,
        "overrides": None,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.put("/overrides", response_model=WeatherOverridesResponse, tags=["Weather Overrides"])
async def update_weather_overrides(
    overrides: WeatherOverridesSchema,
    admin: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WeatherOverridesResponse:
    """
    Update weather override settings for testing/simulation.
    
    **Admin endpoint** - Update weather metrics temporarily for testing flood scenarios.
    Overrides last until cleared or changed. Affects weather API responses and flood predictions.
    
    **Parameters:**
    - `wind_speed_kmh`: Override wind speed (0-200 km/h)
    - `rainfall_mm`: Override rainfall (0-500 mm)
    - `temperature_c`: Override temperature (-50 to +60°C)
    - `humidity_percent`: Override humidity (0-100%)
    - `pressure_hpa`: Override atmospheric pressure (800-1100 hPa)
    - `visibility_km`: Override visibility (0-50 km)
    - `affected_districts`: List of district codes to affect (optional)
    - `active`: Whether overrides are currently active
    """
    
    # Get or create weather_overrides setting
    stmt = select(SystemSetting).where(
        SystemSetting.key == "weather_overrides"
    )
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    override_data = {
        "wind_speed_kmh": overrides.wind_speed_kmh,
        "rainfall_mm": overrides.rainfall_mm,
        "temperature_c": overrides.temperature_c,
        "humidity_percent": overrides.humidity_percent,
        "pressure_hpa": overrides.pressure_hpa,
        "visibility_km": overrides.visibility_km,
        "affected_districts": overrides.affected_districts or [],
        "active": overrides.active,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": admin.email if admin else "admin"
    }
    
    if setting:
        setting.value = json.dumps(override_data)
        setting.updated_at = datetime.utcnow()
        setting.updated_by_id = admin.id if admin else None
    else:
        setting = SystemSetting(
            key="weather_overrides",
            value=json.dumps(override_data),
            value_type="json",
            is_encrypted=False,
            updated_by_id=admin.id if admin else None
        )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    # Publish override event to all connected clients
    await integration_state_service.publish_event(
        "weather_override_changed",
        {
            "wind_speed_kmh": overrides.wind_speed_kmh,
            "rainfall_mm": overrides.rainfall_mm,
            "temperature_c": overrides.temperature_c,
            "humidity_percent": overrides.humidity_percent,
            "pressure_hpa": overrides.pressure_hpa,
            "visibility_km": overrides.visibility_km,
            "active": overrides.active,
            "affected_districts": overrides.affected_districts or [],
            "changed_by": admin.email if admin else "admin",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    return WeatherOverridesResponse(
        status="saved",
        active=overrides.active,
        affected_count=len(overrides.affected_districts or []),
        updated_at=setting.updated_at,
        overrides=override_data
    )


@router.delete("/overrides", response_model=dict, tags=["Weather Overrides"])  
async def delete_weather_overrides(
    admin: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Clear/disable weather overrides.
    
    **Admin endpoint** - Removes all active weather overrides and returns to real weather data.
    """
    query = select(SystemSetting).where(
        SystemSetting.key == "weather_overrides"
    )
    result = await db.execute(query)
    setting = result.scalar_one_or_none()
    
    message = "No active overrides to clear"
    
    if setting:
        await db.delete(setting)
        await db.commit()
        message = "Weather overrides cleared successfully"
        
        # Publish clear event
        await integration_state_service.publish_event(
            "weather_override_cleared",
            {
                "cleared_by": admin.email if admin else "admin",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return {
        "status": "cleared",
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
