import { useState, useEffect, useCallback } from 'react';

const DEFAULT_LAT = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '8.3593');
const DEFAULT_LON = parseFloat(import.meta.env.VITE_DEFAULT_LON || '80.5103');
const WEATHER_API = import.meta.env.VITE_WEATHER_API || 'https://api.open-meteo.com';
const RAIN_API = import.meta.env.VITE_RAIN_API || 'https://api.rainviewer.com';

// Refresh interval: 5 minutes
const REFRESH_MS = 5 * 60 * 1000;

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  rainfall: number;
  weatherCode: number;
  time: string;
}

export interface RainRadarFrame {
  path: string;
  time: number;
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
      const url = `${WEATHER_API}/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const data = await res.json();

      const current = data.current_weather;
      // Get the current hour's precipitation from the hourly array
      const now = new Date();
      const hourIndex = now.getUTCHours();
      const rainfall = data.hourly?.precipitation?.[hourIndex] ?? 0;

      setWeather({
        temperature: current.temperature,
        windSpeed: current.windspeed,
        rainfall,
        weatherCode: current.weathercode,
        time: current.time,
      });
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Weather fetch failed:', err);
      setError('Weather data temporarily unavailable.');
    }
  }, [lat, lon]);

  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch(`${RAIN_API}/public/weather-maps.json`);
      if (!res.ok) throw new Error(`Radar API returned ${res.status}`);
      const data = await res.json();

      // Use the most recent radar frame
      const frames: RainRadarFrame[] = data.radar?.past ?? [];
      if (frames.length > 0) {
        const latest = frames[frames.length - 1];
        // RainViewer tile URL pattern: https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png
        setRadarTileUrl(`https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`);
      }
    } catch (err) {
      console.error('Radar fetch failed:', err);
      // Non-critical — just no overlay
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWeather(), fetchRadar()]).finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchWeather();
      fetchRadar();
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, [fetchWeather, fetchRadar]);

  return { weather, radarTileUrl, loading, error, lastUpdated };
}

// Sri Lanka map constants
export const SRI_LANKA_CENTER: [number, number] = [DEFAULT_LAT, DEFAULT_LON];
export const SRI_LANKA_BOUNDS: [[number, number], [number, number]] = [
  [5.8, 79.5],  // SouthWest
  [9.9, 81.9],  // NorthEast
];
export const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_ZOOM || '9', 10);
