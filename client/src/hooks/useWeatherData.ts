import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherSnapshot } from '../services/integrationApi';

const DEFAULT_LAT = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '8.3593');
const DEFAULT_LON = parseFloat(import.meta.env.VITE_DEFAULT_LON || '80.5103');

// Refresh interval: 5 minutes
const REFRESH_MS = 5 * 60 * 1000;

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  rainfall: number;
  weatherCode: number;
  time: string;
}

export interface UseWeatherResult {
  weather: WeatherData | null;
  radarTileUrl: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useWeatherData(
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      const snapshot = await fetchWeatherSnapshot(lat, lon);
      setWeather(snapshot.weather);
      setRadarTileUrl(snapshot.radarTileUrl);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Weather fetch failed:', err);
      setError('Weather data temporarily unavailable.');
    }
  }, [lat, lon]);

  useEffect(() => {
    setLoading(true);
    fetchWeather().finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchWeather();
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, radarTileUrl, loading, error, lastUpdated };
}

// Sri Lanka map constants
export const SRI_LANKA_CENTER: [number, number] = [DEFAULT_LAT, DEFAULT_LON];
export const SRI_LANKA_BOUNDS: [[number, number], [number, number]] = [
  [5.8, 79.5],  // SouthWest
  [9.9, 81.9],  // NorthEast
];
export const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_ZOOM || '9', 10);
