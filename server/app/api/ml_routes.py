from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import time

from app.ml.predictor import FloodPredictor

router = APIRouter(prefix="/api/v1/ml", tags=["Machine Learning"])
predictor = FloodPredictor()

class PredictionRequest(BaseModel):
    latitude: float = Field(..., ge=5.9, le=9.9)
    longitude: float = Field(..., ge=79.5, le=82.0)
    elevation_m: float = Field(..., ge=0)
    rainfall_7d_mm: float = Field(..., ge=0)
    monthly_rainfall_mm: float = Field(..., ge=0)
    drainage_index: float = Field(..., ge=0, le=1)
    soil_type: str = Field(..., pattern="^(Clay|Loamy|Silty|Sandy|Rocky)$")
    landcover: str
    urban_rural: str
    distance_to_river_m: float = Field(..., ge=0)
    ndvi: Optional[float] = 0.5
    ndwi: Optional[float] = 0.0
    built_up_percent: Optional[float] = 0.0
    population_density_per_km2: Optional[float] = 0.0
    infrastructure_score: Optional[float] = 50.0
    historical_flood_count: Optional[int] = 0
    nearest_hospital_km: Optional[float] = 10.0
    nearest_evac_km: Optional[float] = 10.0
    water_presence_flag: Optional[str] = "Unlikely"
    road_quality: Optional[str] = "Fair"
    electricity: Optional[str] = "Mixed"
    water_supply: Optional[str] = "Well"
    district: Optional[str] = "Unknown"
    place_name: Optional[str] = "Unknown"

class FactorContribution(BaseModel):
    feature: str
    contribution: float
    
class PredictionResponse(BaseModel):
    prediction: str
    flood_probability: float
    risk_level: str
    confidence: float
    top_risk_factors: List[FactorContribution]
    recommendations: List[str]
    prediction_time_ms: float

@router.post("/predict", response_model=PredictionResponse)
async def predict_flood(request: PredictionRequest):
    """
    Predict flood for a single location
    """
    try:
        result = predictor.predict(request.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/batch", response_model=List[PredictionResponse])
async def predict_flood_batch(locations: List[PredictionRequest]):
    """Batch prediction endpoint"""
    try:
        data_dicts = [req.dict() for req in locations]
        results = predictor.predict_batch(data_dicts)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/info")
async def get_model_info():
    """
    Return model metadata
    """
    return predictor.get_model_info()

@router.post("/predict/district")
async def predict_district_risk(district_name: str):
    """
    Predict flood risk for entire district
    (Requires integration with DB to fetch valid locations)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet. Connect to real DB locations.")
