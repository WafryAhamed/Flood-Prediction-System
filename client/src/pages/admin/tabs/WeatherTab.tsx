import React, { useState } from 'react';
import { AlertTriangle, Cloud, Droplets, Wind } from 'lucide-react';
import { useWeatherData } from '../../../hooks/useWeatherData';
import { useAdminCentralStore } from '../../../stores/adminCentralStore';

export default function WeatherTab() {
  const { weather } = useWeatherData();
  const weatherOverrides = useAdminCentralStore((s) => s.weatherOverrides);
  const setWeatherOverrides = useAdminCentralStore((s) => s.setWeatherOverrides);

  const [windInput, setWindInput] = useState(weatherOverrides.windSpeed?.toString() || '');
  const [rainfallInput, setRainfallInput] = useState(weatherOverrides.rainfall?.toString() || '');
  const [tempInput, setTempInput] = useState(weatherOverrides.temperature?.toString() || '');

  const handleSaveOverride = () => {
    setWeatherOverrides({
      windSpeed: windInput ? parseFloat(windInput) : null,
      rainfall: rainfallInput ? parseFloat(rainfallInput) : null,
      temperature: tempInput ? parseFloat(tempInput) : null,
    });
  };

  const currentTemp = weatherOverrides.temperature || weather?.temperature || 28;
  const currentWind = weatherOverrides.windSpeed || weather?.windSpeed || 12;
  const currentRain = weatherOverrides.rainfall || weather?.rainfall || 2.5;

  return (
    <div className="space-y-8">
      {/* Current Weather Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 p-6 rounded-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase mb-2">Temperature</p>
              <p className="text-4xl font-black">{Math.round(currentTemp)}°C</p>
            </div>
            <Cloud size={32} className="text-blue-200" />
          </div>
          <p className="text-xs text-blue-100">
            {currentTemp > 30 ? 'Hot & Humid' : currentTemp > 25 ? 'Warm' : 'Cool'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 border border-cyan-700 p-6 rounded-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-cyan-200 uppercase mb-2">Wind Speed</p>
              <p className="text-4xl font-black">{Math.round(currentWind)} km/h</p>
            </div>
            <Wind size={32} className="text-cyan-200" />
          </div>
          <p className="text-xs text-cyan-100">
            {currentWind > 40 ? 'High Risk' : currentWind > 25 ? 'Moderate' : 'Safe'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 border border-orange-700 p-6 rounded-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-orange-200 uppercase mb-2">Rainfall</p>
              <p className="text-4xl font-black">{currentRain.toFixed(1)} mm</p>
            </div>
            <Droplets size={32} className="text-orange-200" />
          </div>
          <p className="text-xs text-orange-100">
            {currentRain > 50 ? 'Heavy Rain' : currentRain > 20 ? 'Moderate' : 'Light'}
          </p>
        </div>
      </div>

      {/* Weather Overrides */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-6 flex items-center gap-2">
          <AlertTriangle size={18} /> Dashboard Overrides
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Set manual overrides for dashboard metrics. Leave empty to use live data from weather
          service.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Auto"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                Wind Speed (km/h)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Auto"
                value={windInput}
                onChange={(e) => setWindInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                Rainfall (mm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Auto"
                value={rainfallInput}
                onChange={(e) => setRainfallInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <button
            onClick={handleSaveOverride}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase rounded-lg transition-colors"
          >
            Save Overrides
          </button>

          {Object.values(weatherOverrides).some((v) => v !== null) && (
            <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded text-xs text-blue-400">
              ℹ️ Overrides are active. Click Save to update.
            </div>
          )}
        </div>
      </div>

      {/* Weather Alerts */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-orange-400 mb-4">Active Weather Alerts</h3>
        {currentRain > 50 && (
          <div className="p-4 bg-orange-500/10 border border-orange-400 rounded text-orange-400 text-sm mb-3">
            ⚠️ Heavy rainfall detected. Risk of flooding in low-lying areas.
          </div>
        )}
        {currentWind > 40 && (
          <div className="p-4 bg-red-500/10 border border-red-400 rounded text-red-400 text-sm mb-3">
            ⚠️ High wind speed detected. Risk of structural damage.
          </div>
        )}
        {currentTemp > 35 && (
          <div className="p-4 bg-red-500/10 border border-red-400 rounded text-red-400 text-sm mb-3">
            ⚠️ Extreme heat alert. Risk of heat-related illnesses.
          </div>
        )}
        {currentRain <= 50 && currentWind <= 40 && currentTemp <= 35 && (
          <div className="p-4 bg-green-500/10 border border-green-400 rounded text-green-400 text-sm">
            ✓ No active weather alerts. Conditions are within normal range.
          </div>
        )}
      </div>
    </div>
  );
}
