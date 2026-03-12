"""
GIS and spatial models for districts, risk zones, shelters, and infrastructure.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel, AuditedModel


class RiskLevel(str, enum.Enum):
    """Risk level classification."""
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    SAFE = "safe"


class ZoneType(str, enum.Enum):
    """Zone type classification."""
    FLOOD_RISK = "flood_risk"
    EVACUATION = "evacuation"
    SAFE_ASSEMBLY = "safe_assembly"
    AGRICULTURAL = "agricultural"


class FacilityType(str, enum.Enum):
    """Facility type classification."""
    SHELTER = "shelter"
    HOSPITAL = "hospital"
    SCHOOL = "school"
    GOVERNMENT_BUILDING = "government_building"
    TEMPLE = "temple"
    COMMUNITY_CENTER = "community_center"


class FacilityStatus(str, enum.Enum):
    """Facility operational status."""
    OPERATIONAL = "operational"
    ACTIVE = "active"
    STANDBY = "standby"
    FULL = "full"
    CLOSED = "closed"
    DAMAGED = "damaged"


class RouteStatus(str, enum.Enum):
    """Evacuation route status."""
    ACTIVE = "active"
    CAUTION = "caution"
    BLOCKED = "blocked"
    FLOODED = "flooded"


class AssetType(str, enum.Enum):
    """Infrastructure asset types."""
    BRIDGE = "bridge"
    ROAD = "road"
    DAM = "dam"
    DRAINAGE = "drainage"
    PUMP_STATION = "pump_station"
    GAUGE_STATION = "gauge_station"
    POWER_STATION = "power_station"
    WATER_SUPPLY = "water_supply"


class AssetCondition(str, enum.Enum):
    """Infrastructure asset condition."""
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    AT_RISK = "at_risk"
    DAMAGED = "damaged"
    OFFLINE = "offline"


class District(BaseModel):
    """Sri Lanka districts."""
    
    __tablename__ = "districts"
    __table_args__ = (
        Index("ix_districts_code", "code"),
        Index("ix_districts_geom", "geom", postgresql_using="gist"),
    )

    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Sinhala
    name_ta: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Tamil
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Population and area
    population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    area_sq_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Risk assessment
    current_risk_level: Mapped[RiskLevel] = mapped_column(
        SQLEnum(RiskLevel, name="risk_level"),
        default=RiskLevel.SAFE,
        nullable=False,
    )
    shelter_readiness: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    
    # Geometry - MultiPolygon in WGS84
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326),
        nullable=True,
    )
    
    # Centroid for quick lookups
    centroid_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    centroid_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    risk_zones: Mapped[List["RiskZone"]] = relationship("RiskZone", back_populates="district")
    shelters: Mapped[List["Shelter"]] = relationship("Shelter", back_populates="district")
    reports: Mapped[List["CitizenReport"]] = relationship("CitizenReport", back_populates="district")
    risk_snapshots: Mapped[List["DistrictRiskSnapshot"]] = relationship("DistrictRiskSnapshot", back_populates="district")


class RiskZone(AuditedModel):
    """Flood risk zones."""
    
    __tablename__ = "risk_zones"
    __table_args__ = (
        Index("ix_risk_zones_district_id", "district_id"),
        Index("ix_risk_zones_risk_level", "risk_level"),
        Index("ix_risk_zones_geom", "geom", postgresql_using="gist"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    zone_type: Mapped[ZoneType] = mapped_column(
        SQLEnum(ZoneType, name="zone_type"),
        default=ZoneType.FLOOD_RISK,
        nullable=False,
    )
    risk_level: Mapped[RiskLevel] = mapped_column(
        SQLEnum(RiskLevel, name="risk_level"),
        default=RiskLevel.MODERATE,
        nullable=False,
    )
    
    # District relationship
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Geometry - MultiPolygon in WGS84
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326),
        nullable=True,
    )
    
    # Risk parameters
    elevation_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    elevation_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    flood_depth_expected: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # meters
    
    # Visibility
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    district: Mapped[Optional["District"]] = relationship("District", back_populates="risk_zones")


class Shelter(AuditedModel):
    """Emergency shelters and evacuation centers."""
    
    __tablename__ = "shelters"
    __table_args__ = (
        Index("ix_shelters_district_id", "district_id"),
        Index("ix_shelters_status", "status"),
        Index("ix_shelters_geom", "geom", postgresql_using="gist"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_si: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name_ta: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    facility_type: Mapped[FacilityType] = mapped_column(
        SQLEnum(FacilityType, name="facility_type"),
        default=FacilityType.SHELTER,
        nullable=False,
    )
    status: Mapped[FacilityStatus] = mapped_column(
        SQLEnum(FacilityStatus, name="facility_status"),
        default=FacilityStatus.STANDBY,
        nullable=False,
    )
    
    # District
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Capacity
    total_capacity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_occupancy: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Facilities
    has_medical: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_food: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_water: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_electricity: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_wheelchair_accessible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Risk assessment
    is_at_risk: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    risk_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Contact
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Visibility
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    district: Mapped[Optional["District"]] = relationship("District", back_populates="shelters")


class EvacuationRoute(AuditedModel):
    """Evacuation routes."""
    
    __tablename__ = "evacuation_routes"
    __table_args__ = (
        Index("ix_evacuation_routes_status", "status"),
        Index("ix_evacuation_routes_geom", "geom", postgresql_using="gist"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    from_location: Mapped[str] = mapped_column(String(255), nullable=False)
    to_location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[RouteStatus] = mapped_column(
        SQLEnum(RouteStatus, name="route_status"),
        default=RouteStatus.ACTIVE,
        nullable=False,
    )
    
    # Route geometry - LineString in WGS84
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("LINESTRING", srid=4326),
        nullable=True,
    )
    
    # Route metrics
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_time_mins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Accessibility
    is_wheelchair_safe: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_elderly_friendly: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avoids_water: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_water_depth_cm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Destination shelter
    destination_shelter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shelters.id"),
        nullable=True,
    )
    
    # Visibility
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class InfrastructureAsset(AuditedModel):
    """Infrastructure assets (bridges, dams, pump stations, etc.)."""
    
    __tablename__ = "infrastructure_assets"
    __table_args__ = (
        Index("ix_infrastructure_assets_type", "asset_type"),
        Index("ix_infrastructure_assets_condition", "condition"),
        Index("ix_infrastructure_assets_geom", "geom", postgresql_using="gist"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(
        SQLEnum(AssetType, name="asset_type"),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    condition: Mapped[AssetCondition] = mapped_column(
        SQLEnum(AssetCondition, name="asset_condition"),
        default=AssetCondition.OPERATIONAL,
        nullable=False,
    )
    
    # Location
    geom: Mapped[Optional[str]] = mapped_column(
        Geometry("GEOMETRY", srid=4326),  # Can be Point, LineString, or Polygon
        nullable=True,
    )
    
    # District
    district_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id"),
        nullable=True,
    )
    
    # Monitoring
    last_inspection_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_inspection_due: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Readings (for gauge stations, etc.)
    current_reading: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    threshold_warning: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    threshold_critical: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Visibility
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class TransportUnit(AuditedModel):
    """Transport units for evacuation (buses, boats, etc.)."""
    
    __tablename__ = "transport_units"
    __table_args__ = (
        Index("ix_transport_units_status", "status"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(50), nullable=False)  # bus, boat, ambulance, truck
    registration: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    capacity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="available", nullable=False)  # available, deployed, maintenance
    
    # Current assignment
    current_route_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evacuation_routes.id"),
        nullable=True,
    )
    current_location: Mapped[Optional[str]] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )
    
    # Contact
    driver_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DistrictRiskSnapshot(BaseModel):
    """Time-series snapshots of district risk levels."""
    
    __tablename__ = "district_risk_snapshots"
    __table_args__ = (
        Index("ix_district_risk_snapshots_district_id", "district_id"),
        Index("ix_district_risk_snapshots_timestamp", "snapshot_at"),
    )

    district_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    risk_level: Mapped[RiskLevel] = mapped_column(
        SQLEnum(RiskLevel, name="risk_level"),
        nullable=False,
    )
    
    # Contributing factors
    rainfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    river_level_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    active_reports: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    district: Mapped["District"] = relationship("District", back_populates="risk_snapshots")
