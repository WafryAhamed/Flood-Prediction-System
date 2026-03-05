/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_LAT: string;
  readonly VITE_DEFAULT_LON: string;
  readonly VITE_DEFAULT_ZOOM: string;
  readonly VITE_WEATHER_API: string;
  readonly VITE_RAIN_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
