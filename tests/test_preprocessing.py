import pytest
import pandas as pd
import numpy as np
from ml_pipeline.ml.preprocessing import (
    load_and_validate_data, remove_leakage_columns, engineer_features,
    encode_categorical_features, impute_missing_values, scale_features
)

@pytest.fixture
def mock_raw_data():
    return pd.DataFrame({
        'latitude': [7.0, 8.0, 9.0],
        'longitude': [80.0, 81.0, 80.5],
        'elevation_m': [10, 60, 100],
        'rainfall_7d_mm': [200, 50, 0],
        'monthly_rainfall_mm': [300, 100, 20],
        'distance_to_river_m': [100, 1500, 500],
        'drainage_index': [0.1, 0.8, 0.5],
        'soil_type': ['Clay', 'Sandy', 'Loamy'],
        'generation_date': ['2023-05-10', '2023-11-20', '2023-01-15'],
        'water_presence_flag': ['Likely', 'Unlikely', 'Likely'],
        'infrastructure_score': [30, 80, 50],
        'inundation_area_sqm': [5000, 0, 0], # Leakage
        'flood_risk_score': [0.9, 0.1, 0.4]  # Leakage
    })

def test_leakage_removal(mock_raw_data):
    """Ensure leakage columns are removed"""
    df_clean = remove_leakage_columns(mock_raw_data)
    assert 'inundation_area_sqm' not in df_clean.columns
    assert 'flood_risk_score' not in df_clean.columns
    assert 'generation_date' not in df_clean.columns
    assert 'month' in df_clean.columns
    assert 'is_monsoon' in df_clean.columns

def test_feature_engineering(mock_raw_data):
    """Verify engineered features are correct"""
    df_feat = engineer_features(mock_raw_data)
    
    assert 'rainfall_intensity' in df_feat.columns
    assert df_feat['rainfall_intensity'].iloc[0] == 200 / 7.0
    
    assert 'very_low_elevation' in df_feat.columns
    assert df_feat['very_low_elevation'].iloc[0] == 1
    assert df_feat['very_low_elevation'].iloc[1] == 0

def test_categorical_encoding(mock_raw_data):
    """Check encoders work properly"""
    df_clean = remove_leakage_columns(mock_raw_data)
    df_feat = engineer_features(df_clean)
    
    df_encoded, encoders = encode_categorical_features(df_feat, is_train=True)
    
    assert 'soil_type' not in df_encoded.columns
    assert 'ohe' in encoders
    assert any(col.startswith('soil_type_') for col in df_encoded.columns)
