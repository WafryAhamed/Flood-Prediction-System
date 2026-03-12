import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherData, SRI_LANKA_CENTER, SRI_LANKA_BOUNDS, DEFAULT_ZOOM } from '../hooks/useWeatherData';
import { useReportStore } from '../stores/reportStore';

// Marker icons
const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const blueIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const orangeIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const violetIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function getReportSeverityIcon(severity: string) {
  switch (severity) {
    case 'CRITICAL': return redIcon;
    case 'HIGH': return orangeIcon;
    case 'MEDIUM': return blueIcon;
    default: return greenIcon;
  }
}

// --- Sri Lanka Flood Risk Zones (real geographic polygons) ---

// Critical zone: Kelani River basin near Colombo (flood-prone lowlands)
const criticalZone: [number, number][] = [
  [6.93, 79.85], [6.95, 79.90], [6.98, 79.92],
  [7.00, 79.88], [6.97, 79.84], [6.93, 79.85],
];

// High risk zone: Kalu Ganga basin — Ratnapura area
const highRiskZone: [number, number][] = [
  [6.65, 80.35], [6.70, 80.42], [6.72, 80.40],
  [6.70, 80.33], [6.66, 80.32], [6.65, 80.35],
];

// Safe zone: Mihintale highland area
const safeZone: [number, number][] = [
  [8.34, 80.48], [8.37, 80.52], [8.39, 80.51],
  [8.38, 80.47], [8.35, 80.46], [8.34, 80.48],
];

// --- Points of Interest ---
const markers = [
  { pos: [8.3593, 80.5103] as [number, number], label: 'Mihintale — Command Center', type: 'shelter' as const, detail: 'Main coordination hub' },
  { pos: [8.3114, 80.4037] as [number, number], label: 'Anuradhapura Hospital', type: 'hospital' as const, detail: 'District General Hospital — 500 beds' },
  { pos: [6.9271, 79.8612] as [number, number], label: 'Colombo Shelter', type: 'shelter' as const, detail: 'Emergency Shelter — Capacity 2,000' },
  { pos: [6.6828, 80.3964] as [number, number], label: 'Ratnapura Flood Report', type: 'report' as const, detail: 'Water level rising — 1.8 m above normal' },
  { pos: [7.2906, 80.6337] as [number, number], label: 'Kandy General Hospital', type: 'hospital' as const, detail: 'Teaching Hospital — 1,200 beds' },
  { pos: [7.8731, 80.6517] as [number, number], label: 'Dambulla Shelter', type: 'shelter' as const, detail: 'Safe zone shelter — Capacity 800' },
];

function getMarkerIcon(type: 'shelter' | 'hospital' | 'report') {
  switch (type) {
    case 'shelter': return greenIcon;
    case 'hospital': return blueIcon;
    case 'report': return orangeIcon;
    default: return redIcon;
  }
}

// Component to fly to user location when detected
function UserLocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        // Only fly if inside Sri Lanka bounds
        if (latlng[0] >= 5.8 && latlng[0] <= 9.9 && latlng[1] >= 79.5 && latlng[1] <= 81.9) {
          setPosition(latlng);
          map.flyTo(latlng, 12, { duration: 1.5 });
        }
      },
      () => { /* silently ignore denial */ },
      { timeout: 8000 }
    );
  }, [map]);

  if (!position) return null;
  return (
    <Circle
      center={position}
      radius={500}
      pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.25, weight: 2 }}
    >
      <Popup><div className="font-bold text-sm">📍 Your Location</div></Popup>
    </Circle>
  );
}

export function RiskMap() {
  const { weather, radarTileUrl, error } = useWeatherData();
  const verifiedReports = useReportStore((s) =>
    s.reports.filter((r) => r.status === 'verified' || r.status === 'action_in_progress')
  );

  return (
    <div className="h-full w-full min-h-[400px] border-4 border-black relative z-0">
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
        maxBounds={SRI_LANKA_BOUNDS as LatLngBoundsExpression}
        maxBoundsViscosity={1.0}
        minZoom={7}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Rain Radar Overlay */}
        {radarTileUrl && (
          <TileLayer url={radarTileUrl} opacity={0.5} />
        )}

        {/* Critical Flood Zone — Kelani River */}
        <Polygon
          positions={criticalZone}
          pathOptions={{ color: '#DC2626', weight: 3, fillColor: '#DC2626', fillOpacity: 0.45 }}
        >
          <Popup>
            <div className="font-black text-lg uppercase text-red-600">Critical Flood Zone</div>
            <div className="font-bold text-sm">Kelani River Basin — Evacuate Immediately</div>
          </Popup>
        </Polygon>

        {/* High Risk Zone — Ratnapura */}
        <Polygon
          positions={highRiskZone}
          pathOptions={{ color: '#F97316', weight: 3, fillColor: '#F97316', fillOpacity: 0.4 }}
        >
          <Popup>
            <div className="font-black text-lg uppercase text-orange-500">High Risk Zone</div>
            <div className="font-bold text-sm">Kalu Ganga Basin — Prepare for evacuation</div>
          </Popup>
        </Polygon>

        {/* Safe Zone — Mihintale */}
        <Polygon
          positions={safeZone}
          pathOptions={{ color: '#16A34A', weight: 3, fillColor: '#16A34A', fillOpacity: 0.4 }}
        >
          <Popup>
            <div className="font-black text-lg uppercase text-green-600">Safe Assembly Area</div>
            <div className="font-bold text-sm">Mihintale Highland — Capacity: 85%</div>
          </Popup>
        </Polygon>

        {/* POI Markers */}
        {markers.map((m, i) => (
          <Marker key={i} position={m.pos} icon={getMarkerIcon(m.type)}>
            <Popup>
              <div className="font-black uppercase text-sm">{m.label}</div>
              <div className="text-xs mt-1">{m.detail}</div>
            </Popup>
          </Marker>
        ))}

        {/* User's real location */}
        <UserLocationMarker />

        {/* Verified Community Reports */}
        {verifiedReports.map((r) => (
          <Marker
            key={r.report_id}
            position={[r.latitude, r.longitude]}
            icon={getReportSeverityIcon(r.severity_level)}
          >
            <Popup>
              <div className="font-black uppercase text-sm text-red-600">
                Community Report — {r.severity_level}
              </div>
              <div className="text-xs mt-1">{r.description}</div>
              <div className="text-xs mt-1 font-semibold">{r.location_name}</div>
              {r.emergency_response_status && (
                <div className="text-xs mt-1 font-bold text-purple-600">{r.emergency_response_status}</div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Weather Info Badge */}
      {weather && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-0.5">
          <div className="font-bold text-sm text-text-primary mb-1">🌦 Mihintale Weather</div>
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Temp</span>
            <span className="font-bold">{weather.temperature}°C</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Wind</span>
            <span className="font-bold">{weather.windSpeed} km/h</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Rain</span>
            <span className="font-bold">{weather.rainfall} mm</span>
          </div>
        </div>
      )}
      {error && !weather && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[1000] bg-red-50 border border-red-200 rounded-lg shadow-md px-3 py-2 text-xs text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Legend Overlay */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-[1000] bg-white border-4 border-black p-2 md:p-3 flex flex-col gap-1.5 md:gap-2">
        <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-1">
          Risk Zones
        </h4>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 h-4 md:w-6 md:h-6 bg-red-600 border-2 border-black opacity-80"></div>
          <span className="font-bold text-[10px] md:text-xs uppercase">Critical</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 h-4 md:w-6 md:h-6 bg-orange-500 border-2 border-black opacity-80"></div>
          <span className="font-bold text-[10px] md:text-xs uppercase">High</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 h-4 md:w-6 md:h-6 bg-green-600 border-2 border-black opacity-80"></div>
          <span className="font-bold text-[10px] md:text-xs uppercase">Safe</span>
        </div>
        <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-1 mt-1">
          Markers
        </h4>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full border border-black"></div>
          <span className="font-bold text-[10px] md:text-xs">Shelters</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full border border-black"></div>
          <span className="font-bold text-[10px] md:text-xs">Hospitals</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full border border-black"></div>
          <span className="font-bold text-[10px] md:text-xs">Flood Reports</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full border border-black"></div>
          <span className="font-bold text-[10px] md:text-xs">Verified Reports</span>
        </div>
      </div>
    </div>
  );
}