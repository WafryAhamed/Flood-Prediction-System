import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom brutalist marker (default marker from CDN)
const customIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const floodZone = [[51.505, -0.09], [51.51, -0.1], [51.51, -0.12], [51.505, -0.12]];
const safeZone = [[51.49, -0.08], [51.495, -0.06], [51.49, -0.05]];
export function RiskMap() {
  return <div className="h-full w-full min-h-[400px] border-4 border-black relative z-0">
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} className="h-full w-full" zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Flood Risk Zone - Red */}
        <Polygon positions={floodZone as any} pathOptions={{
        color: '#000000',
        weight: 3,
        fillColor: '#DC2626',
        fillOpacity: 0.5
      }}>
          <Popup>
            <div className="font-black text-lg uppercase text-red-600">
              Critical Flood Zone
            </div>
            <div className="font-bold text-sm">Evacuate Immediately</div>
          </Popup>
        </Polygon>

        {/* Safe Zone - Green */}
        <Polygon positions={safeZone as any} pathOptions={{
        color: '#000000',
        weight: 3,
        fillColor: '#16A34A',
        fillOpacity: 0.5
      }}>
          <Popup>
            <div className="font-black text-lg uppercase text-green-600">
              Safe Assembly Area
            </div>
            <div className="font-bold text-sm">Capacity: 85%</div>
          </Popup>
        </Polygon>

        <Marker position={[51.505, -0.09]} icon={customIcon}>
          <Popup>
            <div className="font-black uppercase">Your Location</div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Brutalist Legend Overlay */}
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
      </div>
    </div>;
}