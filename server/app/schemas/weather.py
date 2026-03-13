"""
Weather and forecast schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import Field
from uuid import UUID

from app.schemas.base import BaseSchema, IDSchema, GeoPointSchema
from app.models.weather import WeatherSource, AlertSeverity, AlertType


# ============================================================================
# Weather Observation Schemas
# ============================================================================

class WeatherObservationResponse(BaseSchema):
    """Weather observation response."""
    
    source: WeatherSource
    station_id: Optional[str] = None
    latitude: float
    longitude: float
    observed_at: datetime
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    pressure_hpa: Optional[float] = None
    precipitation_mm: Optional[float] = None
    precipitation_probability: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[int] = None
    wind_gusts_kmh: Optional[float] = None
    cloud_cover_percent: Optional[int] = None
    visibility_km: Optional[float] = None


class CurrentWeatherResponse(BaseSchema):
    """Current weather for a location/district."""
    
    location: str
    latitude: float
    longitude: float
    observed_at: datetime
    temperature_c: Optional[float] = None
    feels_like_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    precipitation_mm: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


# ============================================================================
# Weather Forecast Schemas
# ============================================================================

class HourlyForecastItem(BaseSchema):
    """Hourly forecast item."""
    
    time: datetime
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    precipitation_mm: Optional[float] = None
    precipitation_probability: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class DailyForecastItem(BaseSchema):
    """Daily forecast item."""
    
    date: datetime
    temperature_min_c: Optional[float] = None
    temperature_max_c: Optional[float] = None
    humidity_min_percent: Optional[float] = None
    humidity_max_percent: Optional[float] = None
    precipitation_mm: Optional[float] = None
    precipitation_probability: Optional[float] = None
    rain_hours: Optional[int] = None
    wind_speed_max_kmh: Optional[float] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class WeatherForecastResponse(BaseSchema):
    """Weather forecast response."""
    
    location: str
    latitude: float
    longitude: float
    generated_at: datetime
    hourly: List[HourlyForecastItem] = []
    daily: List[DailyForecastItem] = []


# ============================================================================
# Radar Schemas
# ============================================================================

class RadarSnapshotResponse(BaseSchema):
    """Radar snapshot response."""
    
    id: UUID
    source: str
    captured_at: datetime
    image_url: str


class RadarTimelineResponse(BaseSchema):
    """Radar timeline for animation."""
    
    snapshots: List[RadarSnapshotResponse]
    bounds: Optional[dict] = None  # GeoJSON bounds


# ============================================================================
# River Gauge Schemas
# ============================================================================

class RiverGaugeReadingResponse(IDSchema):
    """River gauge reading response."""
    
    station_id: str
    station_name: Optional[str] = None
    river_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    measured_at: datetime
    water_level_m: float
    discharge_m3s: Optional[float] = None
    alert_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    is_above_alert: bool
    is_above_danger: bool


class RiverGaugeSummary(BaseSchema):
    """River gauge summary for dashboard."""
    
    station_id: str
    station_name: str
    river_name: Optional[str] = None
    current_level_m: float
    alert_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    status: str  # normal, alert, danger
    trend: str  # rising, falling, stable


# ============================================================================
# Weather Alert Schemas
# ============================================================================

class WeatherAlertResponse(IDSchema):
    """Weather alert response."""
    
    source: str
    external_id: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity
    headline: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    valid_from: datetime
    valid_to: datetime
    affected_districts: Optional[List[str]] = None
    is_active: bool


class ActiveWeatherAlertsResponse(BaseSchema):
    """Active weather alerts response."""
    
    alerts: List[WeatherAlertResponse]
    total: int


# ============================================================================
# Flood Prediction Schemas
# ============================================================================

class FloodPredictionResponse(IDSchema):
    """Flood prediction response."""
    
    model_version: Optional[str] = None
    generated_at: datetime
    prediction_for: datetime
    district_id: Optional[UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    flood_probability: float
    predicted_depth_m: Optional[float] = None
    predicted_risk_level: Optional[str] = None
    confidence: float


class DistrictFloodRiskResponse(BaseSchema):
    """District flood risk response."""
    
    district_code: str
    district_name: str
    current_risk_level: str
    flood_probability_24h: Optional[float] = None
    flood_probability_48h: Optional[float] = None
    flood_probability_72h: Optional[float] = None
    contributing_factors: Optional[dict] = None
    last_updated: datetime


# ============================================================================
# Weather Dashboard Schemas
# ============================================================================

class WeatherDashboardResponse(BaseSchema):
    """Weather dashboard data response."""
    
    current_conditions: List[CurrentWeatherResponse] = []
    river_gauges: List[RiverGaugeSummary] = []
    active_alerts: List[WeatherAlertResponse] = []
    district_risks: List[DistrictFloodRiskResponse] = []
    last_updated: datetime


# ============================================================================
# Open-Meteo Integration
# ============================================================================

class OpenMeteoRequest(BaseSchema):
    """Request parameters for Open-Meteo API."""
    
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    hourly_variables: List[str] = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "precipitation_probability",
        "wind_speed_10m",
        "wind_direction_10m",
    ]
    daily_variables: List[str] = [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
    ]
    timezone: str = "Asia/Colombo"
    forecast_days: int = Field(default=7, ge=1, le=16)


class RainViewerRequest(BaseSchema):
    """Request for RainViewer radar data."""
    
    bounds: Optional[dict] = None  # GeoJSON polygon/bbox
    past_frames: int = Field(default=6, ge=1, le=12)
    future_frames: int = Field(default=3, ge=0, le=6)


# ---------------------------------------------------------------------------
# Router-compatible classes
# ---------------------------------------------------------------------------
class WeatherAlertCreateRequest(BaseSchema):
    """Create a new weather alert."""
    source: str
    external_id: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity
    headline: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    valid_from: datetime
    valid_to: datetime
    affected_districts: Optional[List[str]] = None
