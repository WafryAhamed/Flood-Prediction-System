import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
// Custom brutalist marker
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
        fillColor: '#FF0000',
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
        fillColor: '#00CC00',
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
      <div className="absolute bottom-4 left-4 z-[1000] bg-white border-4 border-black p-3 flex flex-col gap-2">
        <h4 className="font-black uppercase text-sm border-b-2 border-black pb-1 mb-1">
          Risk Zones
        </h4>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#FF0000] border-2 border-black opacity-80"></div>
          <span className="font-bold text-xs uppercase">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#FF6600] border-2 border-black opacity-80"></div>
          <span className="font-bold text-xs uppercase">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#00CC00] border-2 border-black opacity-80"></div>
          <span className="font-bold text-xs uppercase">Safe</span>
        </div>
      </div>
    </div>;
}