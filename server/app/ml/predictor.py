import os
import joblib
import json
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any
import time
from pathlib import Path

logger = logging.getLogger(__name__)

# Fallback path if env var not set
DEFAULT_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
MODELS_DIR = os.getenv("ML_MODELS_DIR", DEFAULT_MODELS_DIR)

class FloodPredictor:
    """
    Production-ready flood prediction service
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FloodPredictor, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
            
        self.model = None
        self.scaler_dict = None
        self.encoder_dict = None
        self.imputer_dict = None
        self.feature_names = None
        self.threshold = 0.5  # Optimal threshold
        
        self.load_models()
        self.initialized = True
        
    def load_models(self):
        try:
            model_path = os.path.join(MODELS_DIR, 'flood_model.pkl')
            scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
            encoders_path = os.path.join(MODELS_DIR, 'encoders.pkl')
            imputers_path = os.path.join(MODELS_DIR, 'imputers.pkl')
            features_path = os.path.join(MODELS_DIR, 'feature_names.json')
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                self.scaler_dict = joblib.load(scaler_path)
                self.encoder_dict = joblib.load(encoders_path)
                self.imputer_dict = joblib.load(imputers_path)
                with open(features_path, 'r') as f:
                    self.feature_names = json.load(f)
                logger.info("Successfully loaded ML models.")
            else:
                logger.warning(f"ML models not found at {MODELS_DIR}. Prediction will be mocked.")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            
    def _mock_predict(self, location_data: dict) -> dict:
        """Fallback prediction when model is not available"""
        score = min(location_data.get('rainfall_7d_mm', 0) / 300.0, 1.0)
        risk = 'HIGH' if score > 0.6 else 'MODERATE' if score > 0.3 else 'LOW'
        return {
            'prediction': 'YES' if score > 0.5 else 'NO',
            'flood_probability': float(score),
            'risk_level': 'CRITICAL' if score > 0.8 else risk,
            'confidence': 0.8,
            'top_risk_factors': [
                {'feature': 'rainfall_7d_mm', 'contribution': 0.4},
            ],
            'recommendations': ["Mock prediction. Model not loaded."],
            'prediction_time_ms': 1.0
        }

    def preprocess_input(self, data_list: List[dict]) -> pd.DataFrame:
        """
        Convert raw location data to model features
        """
        df = pd.DataFrame(data_list)
        
        # 1. Feature Engineering
        # BUG FIX #3: Fixed import path - use relative import instead of src.ml
        try:
            # Try relative import first (when run as module)
            from ...ml_pipeline.ml.preprocessing import engineer_features
        except (ImportError, ValueError):
            # Fallback: add to path and import
            import sys
            sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
            from ml_pipeline.ml.preprocessing import engineer_features
        df = engineer_features(df)
        
        # 2. Impute (assuming knn/median imputers are trained)
        if self.imputer_dict:
            median_cols = ['infrastructure_score', 'population_density_per_km2']
            m_cols_present = [c for c in median_cols if c in df.columns]
            if m_cols_present and 'median_imputer' in self.imputer_dict:
                df[m_cols_present] = self.imputer_dict['median_imputer'].transform(df[m_cols_present])
                
            knn_features = ['latitude', 'longitude', 'rainfall_7d_mm', 'monthly_rainfall_mm', 'ndvi', 'ndwi', 'drainage_index']
            knn_cols_present = [c for c in knn_features if c in df.columns]
            if len(knn_cols_present) == len(knn_features) and 'knn_imputer' in self.imputer_dict:
                df[knn_features] = self.imputer_dict['knn_imputer'].transform(df[knn_features])
        
        # 3. Encode
        if self.encoder_dict:
            ordinal_cols = ['road_quality', 'electricity', 'water_supply']
            ordinal_mappings = {
                'road_quality': {'Poor': 0, 'Fair': 1, 'Good': 2},
                'electricity': {'None': 0, 'Mixed': 1, 'Grid': 2},
                'water_supply': {'Surface': 0, 'Rainwater': 1, 'Well': 2, 'Municipal': 3}
            }
            for col in ordinal_cols:
                if col in df.columns:
                    df[col] = df[col].map(ordinal_mappings[col]).fillna(-1)
                    
            if 'ohe' in self.encoder_dict and self.encoder_dict.get('ohe_cols'):
                ohe_cols = [c for c in self.encoder_dict['ohe_cols'] if c in df.columns]
                encoded_array = self.encoder_dict['ohe'].transform(df[ohe_cols])
                encoded_feature_names = self.encoder_dict['ohe'].get_feature_names_out(ohe_cols)
                encoded_df = pd.DataFrame(encoded_array, columns=encoded_feature_names, index=df.index)
                df = pd.concat([df.drop(columns=ohe_cols), encoded_df], axis=1)
                
            if 'te' in self.encoder_dict and self.encoder_dict.get('te_cols'):
                te_cols = [c for c in self.encoder_dict['te_cols'] if c in df.columns]
                df[te_cols] = self.encoder_dict['te'].transform(df[te_cols])

        # Ensure correct column order
        if self.feature_names:
            for feature in self.feature_names:
                if feature not in df.columns:
                    df[feature] = 0.0
            df = df[self.feature_names]
            
        # 4. Scale
        if self.scaler_dict:
            for col in ['distance_to_river_m', 'population_density_per_km2']:
                if col in df.columns:
                    df[col] = np.log1p(df[col].clip(lower=0))
                    
            if 'robust' in self.scaler_dict:
                rc = [c for c in self.scaler_dict['robust'].feature_names_in_ if c in df.columns]
                df[rc] = self.scaler_dict['robust'].transform(df[rc])
            if 'standard' in self.scaler_dict:
                sc = [c for c in self.scaler_dict['standard'].feature_names_in_ if c in df.columns]
                df[sc] = self.scaler_dict['standard'].transform(df[sc])
            if 'minmax' in self.scaler_dict:
                mc = [c for c in self.scaler_dict['minmax'].feature_names_in_ if c in df.columns]
                df[mc] = self.scaler_dict['minmax'].transform(df[mc])
                
        return df

    def predict(self, location_data: dict) -> dict:
        """
        Generate flood prediction for single location
        """
        if not self.model:
            return self._mock_predict(location_data)
            
        start_time = time.time()
        
        try:
            # Preprocess
            df_features = self.preprocess_input([location_data])
            
            # Predict
            prob = self.model.predict_proba(df_features)[0, 1]
            prediction = 'YES' if prob >= self.threshold else 'NO'
            
            # Risk Level
            if prob > 0.8:
                risk_level = 'CRITICAL'
            elif prob > 0.6:
                risk_level = 'HIGH'
            elif prob > 0.4:
                risk_level = 'MODERATE'
            elif prob > 0.2:
                risk_level = 'LOW'
            else:
                risk_level = 'MINIMAL'

            # Confidence (how far from threshold)
            confidence = float(abs(prob - self.threshold) / 0.5) if prob > self.threshold else float(abs(prob - self.threshold) / 0.5)
            confidence = min(max(confidence, 0.0), 1.0)
            
            # Factors
            top_factors = []
            if hasattr(self.model, 'feature_importances_') and self.feature_names:
                importances = self.model.feature_importances_
                indices = np.argsort(importances)[::-1][:3]
                top_factors = [{'feature': self.feature_names[i], 'contribution': float(importances[i])} for i in indices]
                
            # Recommendations
            recs = {
                'CRITICAL': ["Immediate Evacuation", "Activate emergency response", "Alert authorities"],
                'HIGH': ["Issue flood warning", "Prepare evacuation plan", "Monitor river levels closely"],
                'MODERATE': ["Issue advisory", "Clear drainage channels", "Citizens should be prepared"],
                'LOW': ["Standard monitoring", "Ensure drains are clear"],
                'MINIMAL': ["No immediate action required"]
            }
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            return {
                'prediction': prediction,
                'flood_probability': float(prob),
                'risk_level': risk_level,
                'confidence': float(confidence),
                'top_risk_factors': top_factors,
                'recommendations': recs.get(risk_level, []),
                'prediction_time_ms': float(execution_time_ms)
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise ValueError(f"Failed to generate prediction: {e}")

    def predict_batch(self, locations: List[dict]) -> List[dict]:
        """Batch prediction"""
        if not self.model:
            return [self._mock_predict(loc) for loc in locations]
            
        return [self.predict(loc) for loc in locations]

    def get_model_info(self) -> dict:
        return {
            'model_type': type(self.model).__name__ if self.model else "Mock",
            'version': '1.0',
            'status': 'loaded' if self.model else 'unloaded',
            'feature_count': len(self.feature_names) if self.feature_names else 0
        }
