import axios from 'axios';

const API_BASE = '/api/v1/ml';

export interface PredictionRequest {
  latitude: number;
  longitude: number;
  elevation_m: number;
  rainfall_7d_mm: number;
  monthly_rainfall_mm: number;
  drainage_index: number;
  soil_type: string;
  landcover: string;
  urban_rural: string;
  distance_to_river_m: number;
  ndvi?: number;
  ndwi?: number;
  built_up_percent?: number;
  population_density_per_km2?: number;
  infrastructure_score?: number;
  historical_flood_count?: number;
  nearest_hospital_km?: number;
  nearest_evac_km?: number;
  water_presence_flag?: string;
  road_quality?: string;
  electricity?: string;
  water_supply?: string;
  district?: string;
  place_name?: string;
}

export interface FactorContribution {
  feature: string;
  contribution: number;
}

export interface PredictionResponse {
  prediction: 'YES' | 'NO';
  flood_probability: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';
  confidence: number;
  top_risk_factors: FactorContribution[];
  recommendations: string[];
  prediction_time_ms: number;
}

export const mlApi = {
  predictFlood: async (data: PredictionRequest): Promise<PredictionResponse> => {
    try {
      const response = await axios.post(`${API_BASE}/predict`, data);
      return response.data;
    } catch (error) {
      console.error('API Error during single prediction:', error);
      throw error;
    }
  },
  
  predictBatch: async (locations: PredictionRequest[]): Promise<PredictionResponse[]> => {
    try {
      const response = await axios.post(`${API_BASE}/predict/batch`, locations);
      return response.data;
    } catch (error) {
      console.error('API Error during batch prediction:', error);
      throw error;
    }
  },
  
  getModelInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE}/model/info`);
      return response.data;
    } catch (error) {
      console.error('API Error getting model info:', error);
      throw error;
    }
  }
};
