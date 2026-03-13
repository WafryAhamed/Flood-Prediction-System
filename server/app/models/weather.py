"""
Weather observation, forecast, and hazard models.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel


class WeatherSource(str, enum.Enum):
    """Weather data source."""
    OPEN_METEO = "open_meteo"
    DMC_SRI_LANKA = "dmc"  # Department of Meteorology & Climate
    RAINVIEWER = "rainviewer"
    MANUAL = "manual"


class AlertSeverity(str, enum.Enum):
    """Weather alert severity."""
    EXTREME = "extreme"
    SEVERE = "severe"
    MODERATE = "moderate"
    MINOR = "minor"
    ADVISORY = "advisory"


class AlertType(str, enum.Enum):
    """Weather alert type."""
    HEAVY_RAIN = "heavy_rain"
    FLASH_FLOOD = "flash_flood"
    RIVER_FLOOD = "river_flood"
    CYCLONE = "cyclone"
    LANDSLIDE = "landslide"
    THUNDERSTORM = "thunderstorm"


class WeatherObservation(BaseModel):
    """Observed weather data from stations or APIs."""
    
    __tablename__ = "weather_observations"
    __table_args__ = (
        Index("ix_weather_observations_observed_at", "observed_at"),
        Index("ix_weather_observations_source", "source"),
        Index("ix_weather_observations_location", "geom", postgresql_using="gist"),
    )

    source: Mapped[WeatherSource] = mapped_column(
        SQLEnum(WeatherSource, name="weather_source"),
        nullable=False,
    )
    station_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Timestamp
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Core metrics
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pressure_hpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Precipitation
    precipitation_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precipitation_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Wind
    wind_speed_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_direction_deg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wind_gusts_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Cloud and visibility
    cloud_cover_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    visibility_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # District linkage
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Raw response
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class WeatherForecast(BaseModel):
    """Weather forecast data."""
    
    __tablename__ = "weather_forecasts"
    __table_args__ = (
        Index("ix_weather_forecasts_valid_from", "valid_from"),
        Index("ix_weather_forecasts_valid_to", "valid_to"),
        Index("ix_weather_forecasts_location", "geom", postgresql_using="gist"),
    )

    source: Mapped[WeatherSource] = mapped_column(
        SQLEnum(WeatherSource, name="weather_source"),
        nullable=False,
    )
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Validity period
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Core metrics
    temperature_min_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    temperature_max_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_min_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_max_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Precipitation
    precipitation_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precipitation_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rain_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Wind
    wind_speed_max_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_gusts_max_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # District linkage
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Raw response
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class RadarSnapshot(BaseModel):
    """Radar imagery snapshots from RainViewer or similar."""
    
    __tablename__ = "radar_snapshots"
    __table_args__ = (
        Index("ix_radar_snapshots_captured_at", "captured_at"),
        Index("ix_radar_snapshots_bounds", "bounds", postgresql_using="gist"),
    )

    source: Mapped[str] = mapped_column(String(50), default="rainviewer", nullable=False)
    
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Image storage
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    local_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # If cached locally
    
    # Coverage bounds
    bounds: Mapped[Optional[str]] = mapped_column(
        Geometry("POLYGON", srid=4326),
        nullable=True,
    )
    
    # Metadata
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)


class RiverGaugeReading(BaseModel):
    """River gauge station readings."""
    
    __tablename__ = "river_gauge_readings"
    __table_args__ = (
        Index("ix_river_gauge_readings_station_id", "station_id"),
        Index("ix_river_gauge_readings_measured_at", "measured_at"),
    )

    station_id: Mapped[str] = mapped_column(String(100), nullable=False)
    station_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    river_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Reading
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    water_level_m: Mapped[float] = mapped_column(Float, nullable=False)
    discharge_m3s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # cubic meters/second
    
    # Thresholds
    alert_level_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    danger_level_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Status
    is_above_alert: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_above_danger: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # District linkage
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )


class WeatherAlert(BaseModel):
    """Weather alerts and warnings."""
    
    __tablename__ = "weather_alerts"
    __table_args__ = (
        Index("ix_weather_alerts_alert_type", "alert_type"),
        Index("ix_weather_alerts_severity", "severity"),
        Index("ix_weather_alerts_valid_from", "valid_from"),
        Index("ix_weather_alerts_valid_to", "valid_to"),
        Index("ix_weather_alerts_affected_area", "affected_area", postgresql_using="gist"),
    )

    source: Mapped[str] = mapped_column(String(100), nullable=False)  # DMC, system-generated, etc.
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    alert_type: Mapped[AlertType] = mapped_column(
        SQLEnum(AlertType, name="alert_type"),
        nullable=False,
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        SQLEnum(AlertSeverity, name="alert_severity"),
        nullable=False,
    )
    
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Validity
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Affected area
    affected_area: Mapped[Optional[str]] = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326),
        nullable=True,
    )
    affected_districts: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # List of district codes
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Raw data
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class FloodPrediction(BaseModel):
    """AI/ML flood predictions."""
    
    __tablename__ = "flood_predictions"
    __table_args__ = (
        Index("ix_flood_predictions_district_id", "district_id"),
        Index("ix_flood_predictions_prediction_for", "prediction_for"),
        Index("ix_flood_predictions_confidence", "confidence"),
    )

    model_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("model_registry.id"),
        nullable=True,
    )
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # When was prediction made
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # What time is being predicted
    prediction_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Where
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    
    # Prediction results
    flood_probability: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_depth_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_risk_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Confidence
    confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    
    # Input features used
    input_features: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Explanation (for SHAP values, feature importance, etc.)
    explanation: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    registry_model: Mapped[Optional["ModelRegistry"]] = relationship(  # type: ignore[name-defined]
        "ModelRegistry", foreign_keys=[model_id], back_populates="predictions"
    )
