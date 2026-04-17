import pytest
from fastapi.testclient import TestClient
from server.app.api.ml_routes import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)

client = TestClient(app)

def test_prediction_endpoint():
    """Test /predict endpoint validation and response"""
    
    payload = {
        "latitude": 7.2906,
        "longitude": 80.6337,
        "elevation_m": 45,
        "rainfall_7d_mm": 185,
        "monthly_rainfall_mm": 220,
        "drainage_index": 0.28,
        "soil_type": "Clay",
        "landcover": "Agriculture",
        "urban_rural": "Rural",
        "distance_to_river_m": 650
    }
    
    response = client.post("/api/v1/ml/predict", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "prediction" in data
    assert "flood_probability" in data
    assert "risk_level" in data
    assert data["prediction"] in ["YES", "NO"]

def test_batch_prediction_endpoint():
    """Test /predict/batch endpoint"""
    
    payload = [{
        "latitude": 7.2906,
        "longitude": 80.6337,
        "elevation_m": 45,
        "rainfall_7d_mm": 185,
        "monthly_rainfall_mm": 220,
        "drainage_index": 0.28,
        "soil_type": "Clay",
        "landcover": "Agriculture",
        "urban_rural": "Rural",
        "distance_to_river_m": 650
    }]
    
    response = client.post("/api/v1/ml/predict/batch", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert "prediction" in data[0]

def test_invalid_input():
    """Test /predict with out of bounds latitude"""
    payload = {
        "latitude": -10.0, # Invalid for Sri Lanka
        "longitude": 80.6337,
        "elevation_m": 45,
        "rainfall_7d_mm": 185,
        "monthly_rainfall_mm": 220,
        "drainage_index": 0.28,
        "soil_type": "Clay",
        "landcover": "Agriculture",
        "urban_rural": "Rural",
        "distance_to_river_m": 650
    }
    
    response = client.post("/api/v1/ml/predict", json=payload)
    assert response.status_code == 422 # Unprocessable Entity
