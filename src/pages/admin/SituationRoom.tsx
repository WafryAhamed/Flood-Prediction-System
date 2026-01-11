import React, { useState } from 'react';
import { LiveTile } from '../../components/admin/LiveTile';
import { AlertTriangle, Users, Activity, Radio, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
export function SituationRoom() {
  const [crisisMode, setCrisisMode] = useState(false);
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            National Situation Room
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            LIVE FEED • UPDATED 2S AGO
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCrisisMode(!crisisMode)} className={`px-4 py-2 border font-bold uppercase text-xs tracking-wider transition-all ${crisisMode ? 'bg-[#FF1744] border-[#FF1744] text-white animate-pulse' : 'border-[#FF1744] text-[#FF1744] hover:bg-[#FF1744]/10'}`}>
            {crisisMode ? 'CRISIS MODE ACTIVE' : 'ACTIVATE CRISIS MODE'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <LiveTile label="National Risk Level" value="HIGH" color="red" pulsing={true} className="border-l-4 border-l-[#FF1744]" />
        <LiveTile label="Active Incidents" value="14" trend="2 from last hour" trendUp={false} color="amber" />
        <LiveTile label="Population at Risk" value="12,450" trend="Stable" trendUp={true} color="cyan" />
        <LiveTile label="Response Units" value="84%" trend="Deployed" trendUp={true} color="green" />
      </div>

      {/* Main Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map Section (2 cols) */}
        <div className="lg:col-span-2 bg-[#132F4C] border border-[#1E4976] relative flex flex-col">
          <div className="p-3 border-b border-[#1E4976] flex justify-between items-center bg-[#0A1929]">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF] flex items-center gap-2">
              <MapIcon size={14} /> Geospatial Intel
            </h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-mono-cmd text-gray-400">
                LAYERS: RADAR, RISK, UNITS
              </span>
            </div>
          </div>
          <div className="flex-1 relative admin-map">
            <MapContainer center={[7.8731, 80.7718]} zoom={7} className="h-full w-full bg-[#050B14]">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={[6.9271, 79.8612]} radius={8} pathOptions={{
              color: '#FF1744',
              fillColor: '#FF1744',
              fillOpacity: 0.6
            }}>
                <Popup>Colombo: Critical Flood Risk</Popup>
              </CircleMarker>
              <CircleMarker center={[7.2906, 80.6337]} radius={6} pathOptions={{
              color: '#FFC107',
              fillColor: '#FFC107',
              fillOpacity: 0.6
            }}>
                <Popup>Kandy: Moderate Risk</Popup>
              </CircleMarker>
            </MapContainer>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-4 left-4 bg-[#0A1929]/90 border border-[#1E4976] p-3 z-[1000]">
              <div className="text-[10px] font-mono-cmd text-gray-400 mb-1">
                PRECIPITATION
              </div>
              <div className="text-xl font-bold text-[#00E5FF]">145mm</div>
              <div className="text-xs text-gray-300">Heavy Rain Warning</div>
            </div>
          </div>
        </div>

        {/* Side Panel (1 col) */}
        <div className="flex flex-col gap-4">
          {/* District Status */}
          <div className="flex-1 bg-[#132F4C] border border-[#1E4976] flex flex-col">
            <div className="p-3 border-b border-[#1E4976] bg-[#0A1929]">
              <h3 className="text-xs font-bold uppercase text-[#FFC107] flex items-center gap-2">
                <ShieldAlert size={14} /> District Status
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {[{
              name: 'Colombo',
              status: 'CRITICAL',
              color: 'text-[#FF1744]',
              bg: 'bg-[#FF1744]/10'
            }, {
              name: 'Gampaha',
              status: 'WARNING',
              color: 'text-[#FFC107]',
              bg: 'bg-[#FFC107]/10'
            }, {
              name: 'Kalutara',
              status: 'WATCH',
              color: 'text-[#00E5FF]',
              bg: 'bg-[#00E5FF]/10'
            }, {
              name: 'Galle',
              status: 'NORMAL',
              color: 'text-[#00E676]',
              bg: 'bg-[#00E676]/10'
            }, {
              name: 'Matara',
              status: 'NORMAL',
              color: 'text-[#00E676]',
              bg: 'bg-[#00E676]/10'
            }].map((d, i) => <div key={i} className={`flex justify-between items-center p-3 border border-[#1E4976] ${d.bg}`}>
                  <span className="font-bold text-sm">{d.name}</span>
                  <span className={`font-mono-cmd text-xs font-bold ${d.color}`}>
                    {d.status}
                  </span>
                </div>)}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="h-1/3 bg-[#132F4C] border border-[#1E4976] flex flex-col">
            <div className="p-3 border-b border-[#1E4976] bg-[#0A1929]">
              <h3 className="text-xs font-bold uppercase text-[#FF1744] flex items-center gap-2">
                <Radio size={14} /> Broadcast Feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-3">
                <div className="text-xs border-l-2 border-[#FF1744] pl-2">
                  <div className="font-mono-cmd text-[#FF1744] mb-1">
                    14:02 • SMS BROADCAST
                  </div>
                  <div className="text-gray-300">
                    Evacuation order issued for Sector 7. Immediate compliance
                    required.
                  </div>
                </div>
                <div className="text-xs border-l-2 border-[#FFC107] pl-2">
                  <div className="font-mono-cmd text-[#FFC107] mb-1">
                    13:45 • SYSTEM ALERT
                  </div>
                  <div className="text-gray-300">
                    Water levels exceeding threshold at Kelani Gauge.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}