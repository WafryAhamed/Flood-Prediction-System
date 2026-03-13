"""
GIS and spatial data schemas.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import Field
from uuid import UUID

from app.schemas.base import BaseSchema, IDSchema, GeoPointSchema
from app.models.gis import (
    RiskLevel, ZoneType, FacilityType, FacilityStatus,
    RouteStatus, AssetType, AssetCondition
)


# ============================================================================
# District Schemas
# ============================================================================

class DistrictBase(BaseSchema):
    """Base district schema."""
    
    code: str = Field(max_length=10)
    name: str = Field(max_length=100)
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    province: str = Field(max_length=100)


class DistrictCreate(DistrictBase):
    """District creation schema."""
    
    population: Optional[int] = None
    area_sq_km: Optional[float] = None
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    geojson: Optional[dict] = None  # GeoJSON MultiPolygon


class DistrictUpdate(BaseSchema):
    """District update schema."""
    
    name: Optional[str] = None
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    population: Optional[int] = None
    area_sq_km: Optional[float] = None
    current_risk_level: Optional[RiskLevel] = None
    shelter_readiness: Optional[int] = Field(default=None, ge=0, le=100)


class DistrictResponse(DistrictBase, IDSchema):
    """District response schema."""
    
    population: Optional[int] = None
    area_sq_km: Optional[float] = None
    current_risk_level: RiskLevel
    shelter_readiness: int
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    is_active: bool


class DistrictDetailResponse(DistrictResponse):
    """Detailed district response with geometry."""
    
    geojson: Optional[dict] = None


class DistrictRiskSummary(BaseSchema):
    """District risk summary for dashboard."""
    
    code: str
    name: str
    risk_level: RiskLevel
    shelter_readiness: int
    active_reports: int = 0
    active_alerts: int = 0


# ============================================================================
# Risk Zone Schemas
# ============================================================================

class RiskZoneBase(BaseSchema):
    """Base risk zone schema."""
    
    name: str = Field(max_length=255)
    description: Optional[str] = None
    zone_type: ZoneType = ZoneType.FLOOD_RISK
    risk_level: RiskLevel = RiskLevel.MODERATE


class RiskZoneCreate(RiskZoneBase):
    """Risk zone creation schema."""
    
    district_id: Optional[UUID] = None
    geojson: Optional[dict] = None
    elevation_min: Optional[float] = None
    elevation_max: Optional[float] = None
    flood_depth_expected: Optional[float] = None


class RiskZoneUpdate(BaseSchema):
    """Risk zone update schema."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    zone_type: Optional[ZoneType] = None
    risk_level: Optional[RiskLevel] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class RiskZoneResponse(RiskZoneBase, IDSchema):
    """Risk zone response schema."""
    
    district_id: Optional[UUID] = None
    elevation_min: Optional[float] = None
    elevation_max: Optional[float] = None
    flood_depth_expected: Optional[float] = None
    is_visible: bool
    is_active: bool
    created_at: datetime


class RiskZoneGeoJSON(BaseSchema):
    """Risk zone with GeoJSON geometry."""
    
    id: UUID
    name: str
    risk_level: RiskLevel
    zone_type: ZoneType
    geojson: Optional[dict] = None


# ============================================================================
# Shelter Schemas
# ============================================================================

class ShelterBase(BaseSchema):
    """Base shelter schema."""
    
    name: str = Field(max_length=255)
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    description: Optional[str] = None
    facility_type: FacilityType = FacilityType.SHELTER
    status: FacilityStatus = FacilityStatus.STANDBY


class ShelterCreate(ShelterBase):
    """Shelter creation schema."""
    
    district_id: Optional[UUID] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    address: Optional[str] = None
    sector: Optional[str] = None
    total_capacity: int = Field(default=0, ge=0)
    has_medical: bool = False
    has_food: bool = False
    has_water: bool = False
    has_electricity: bool = False
    is_wheelchair_accessible: bool = False
    contact_phone: Optional[str] = None
    contact_person: Optional[str] = None


class ShelterUpdate(BaseSchema):
    """Shelter update schema."""
    
    name: Optional[str] = None
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    description: Optional[str] = None
    status: Optional[FacilityStatus] = None
    total_capacity: Optional[int] = Field(default=None, ge=0)
    current_occupancy: Optional[int] = Field(default=None, ge=0)
    has_medical: Optional[bool] = None
    has_food: Optional[bool] = None
    has_water: Optional[bool] = None
    has_electricity: Optional[bool] = None
    is_at_risk: Optional[bool] = None
    risk_notes: Optional[str] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class ShelterResponse(ShelterBase, IDSchema):
    """Shelter response schema."""
    
    district_id: Optional[UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    sector: Optional[str] = None
    total_capacity: int
    current_occupancy: int
    available_capacity: int = 0
    has_medical: bool
    has_food: bool
    has_water: bool
    has_electricity: bool
    is_wheelchair_accessible: bool
    is_at_risk: bool
    contact_phone: Optional[str] = None
    contact_person: Optional[str] = None
    is_visible: bool
    is_active: bool


class ShelterMapResponse(BaseSchema):
    """Shelter response for map display."""
    
    id: UUID
    name: str
    latitude: float
    longitude: float
    status: FacilityStatus
    facility_type: FacilityType
    available_capacity: int
    is_at_risk: bool


# ============================================================================
# Evacuation Route Schemas
# ============================================================================

class EvacuationRouteBase(BaseSchema):
    """Base evacuation route schema."""
    
    name: str = Field(max_length=255)
    from_location: str = Field(max_length=255)
    to_location: str = Field(max_length=255)
    description: Optional[str] = None
    status: RouteStatus = RouteStatus.ACTIVE


class EvacuationRouteCreate(EvacuationRouteBase):
    """Evacuation route creation schema."""
    
    geojson: Optional[dict] = None  # GeoJSON LineString
    distance_km: Optional[float] = None
    estimated_time_mins: Optional[int] = None
    is_wheelchair_safe: bool = False
    is_elderly_friendly: bool = False
    avoids_water: bool = True
    destination_shelter_id: Optional[UUID] = None


class EvacuationRouteUpdate(BaseSchema):
    """Evacuation route update schema."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RouteStatus] = None
    max_water_depth_cm: Optional[int] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class EvacuationRouteResponse(EvacuationRouteBase, IDSchema):
    """Evacuation route response schema."""
    
    distance_km: Optional[float] = None
    estimated_time_mins: Optional[int] = None
    is_wheelchair_safe: bool
    is_elderly_friendly: bool
    avoids_water: bool
    max_water_depth_cm: Optional[int] = None
    destination_shelter_id: Optional[UUID] = None
    is_visible: bool
    is_active: bool


class EvacuationRouteGeoJSON(BaseSchema):
    """Evacuation route with full GeoJSON."""
    
    id: UUID
    name: str
    status: RouteStatus
    geojson: Optional[dict] = None


# ============================================================================
# Infrastructure Asset Schemas
# ============================================================================

class InfrastructureAssetBase(BaseSchema):
    """Base infrastructure asset schema."""
    
    name: str = Field(max_length=255)
    asset_type: AssetType
    description: Optional[str] = None
    condition: AssetCondition = AssetCondition.OPERATIONAL


class InfrastructureAssetCreate(InfrastructureAssetBase):
    """Infrastructure asset creation schema."""
    
    district_id: Optional[UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geojson: Optional[dict] = None
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None
    metadata: Optional[dict] = None


class InfrastructureAssetUpdate(BaseSchema):
    """Infrastructure asset update schema."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[AssetCondition] = None
    current_reading: Optional[float] = None
    last_inspection_at: Optional[datetime] = None
    next_inspection_due: Optional[datetime] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class InfrastructureAssetResponse(InfrastructureAssetBase, IDSchema):
    """Infrastructure asset response schema."""
    
    district_id: Optional[UUID] = None
    current_reading: Optional[float] = None
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None
    last_inspection_at: Optional[datetime] = None
    next_inspection_due: Optional[datetime] = None
    is_visible: bool
    is_active: bool
    created_at: datetime


# ============================================================================
# Map Data Response (Composite)
# ============================================================================

class MapDataResponse(BaseSchema):
    """Composite map data response for frontend."""
    
    districts: List[DistrictResponse] = []
    risk_zones: List[RiskZoneGeoJSON] = []
    shelters: List[ShelterMapResponse] = []
    routes: List[EvacuationRouteGeoJSON] = []
    infrastructure: List[InfrastructureAssetResponse] = []


# ---------------------------------------------------------------------------
# Router-compatible aliases and missing classes
# ---------------------------------------------------------------------------
DistrictCreateRequest = DistrictCreate
DistrictUpdateRequest = DistrictUpdate
RiskZoneCreateRequest = RiskZoneCreate
RiskZoneUpdateRequest = RiskZoneUpdate
DistrictRiskSnapshotResponse = DistrictDetailResponse
ShelterDetailResponse = ShelterResponse
ShelterCreateRequest = ShelterCreate
ShelterUpdateRequest = ShelterUpdate
EvacuationRouteCreateRequest = EvacuationRouteCreate
EvacuationRouteUpdateRequest = EvacuationRouteUpdate


class ShelterCapacityUpdate(BaseSchema):
    """Update current occupancy of a shelter."""
    current_occupancy: int = Field(ge=0)
