import React, { useState } from 'react';
import { PredictionRequest } from '../services/mlApi';

interface PredictionFormProps {
  onSubmit: (data: PredictionRequest) => void;
  loading: boolean;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<PredictionRequest>({
    latitude: 7.2906,
    longitude: 80.6337,
    elevation_m: 45,
    rainfall_7d_mm: 185,
    monthly_rainfall_mm: 220,
    drainage_index: 0.28,
    soil_type: 'Clay',
    landcover: 'Agriculture',
    urban_rural: 'Rural',
    distance_to_river_m: 650,
    ndvi: 0.42,
    ndwi: 0.15,
    built_up_percent: 18,
    population_density_per_km2: 520,
    infrastructure_score: 42,
    historical_flood_count: 2,
    nearest_hospital_km: 4.5,
    nearest_evac_km: 2.1,
    water_presence_flag: 'Likely',
    road_quality: 'Fair',
    electricity: 'Mixed',
    water_supply: 'Municipal'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="prediction-form p-6 bg-white rounded-lg shadow-md mb-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Location Data Input</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Core fields */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Elevation (m)</label>
          <input type="number" step="0.1" name="elevation_m" value={formData.elevation_m} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        
        {/* Environmental */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rainfall (mm)</label>
          <input type="number" step="0.1" name="rainfall_7d_mm" value={formData.rainfall_7d_mm} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rainfall (mm)</label>
          <input type="number" step="0.1" name="monthly_rainfall_mm" value={formData.monthly_rainfall_mm} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Distance to River (m)</label>
          <input type="number" step="0.1" name="distance_to_river_m" value={formData.distance_to_river_m} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        
        {/* Topography & Soil */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Drainage Index (0-1)</label>
          <input type="number" step="0.01" name="drainage_index" value={formData.drainage_index} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
          <select name="soil_type" value={formData.soil_type} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required>
            <option value="Clay">Clay</option>
            <option value="Loamy">Loamy</option>
            <option value="Silty">Silty</option>
            <option value="Sandy">Sandy</option>
            <option value="Rocky">Rocky</option>
          </select>
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Landcover</label>
          <select name="landcover" value={formData.landcover} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required>
            <option value="Agriculture">Agriculture</option>
            <option value="Forest">Forest</option>
            <option value="Urban">Urban</option>
            <option value="Wetland">Wetland</option>
            <option value="Grassland">Grassland</option>
          </select>
        </div>
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Urban/Rural</label>
          <select name="urban_rural" value={formData.urban_rural} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" required>
            <option value="Urban">Urban</option>
            <option value="Rural">Rural</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={() => setFormData({...formData})} // Reset could load default or blank
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          disabled={loading}
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Run Flood Prediction'}
        </button>
      </div>
    </form>
  );
};
