import React, { useState } from 'react';
import { AlertTriangle, Users, Activity, Radio, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
export function SituationRoom() {
  const [crisisMode, setCrisisMode] = useState(false);
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            National Situation Room
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            LIVE FEED • UPDATED 2S AGO
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCrisisMode(!crisisMode)} className={`px-6 py-3 border-2 font-bold uppercase text-sm tracking-wider transition-all rounded-lg ${crisisMode ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'border-red-600 text-red-600 hover:bg-red-600/10'}`}>
            {crisisMode ? '🚨 CRISIS MODE ACTIVE' : 'ACTIVATE CRISIS MODE'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-red-600">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">National Risk Level</div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <div className="text-4xl font-bold text-red-500">HIGH</div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-orange-500">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Active Incidents</div>
          <div className="text-4xl font-bold text-white mb-1">14</div>
          <div className="text-sm text-gray-400">2 from last hour</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-blue-400">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Population at Risk</div>
          <div className="text-4xl font-bold text-blue-400">12,450</div>
          <div className="text-sm text-gray-400">Stable</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-green-600">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Response Units</div>
          <div className="text-4xl font-bold text-green-500">84%</div>
          <div className="text-sm text-gray-400">Deployed</div>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map Section (2 cols) */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl relative flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
              <MapIcon size={18} /> Geospatial Intel
            </h3>
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-gray-400">
                LAYERS: RADAR, RISK, UNITS
              </span>
            </div>
          </div>
          <div className="flex-1 relative">
            <MapContainer center={[7.8731, 80.7718]} zoom={7} className="h-full w-full bg-gray-900">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={[6.9271, 79.8612]} radius={8} pathOptions={{
              color: '#DC2626',
              fillColor: '#DC2626',
              fillOpacity: 0.6
            }}>
                <Popup>Colombo: Critical Flood Risk</Popup>
              </CircleMarker>
              <CircleMarker center={[7.2906, 80.6337]} radius={6} pathOptions={{
              color: '#F97316',
              fillColor: '#F97316',
              fillOpacity: 0.6
            }}>
                <Popup>Kandy: Moderate Risk</Popup>
              </CircleMarker>
            </MapContainer>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-6 left-6 bg-gray-900/95 border border-gray-700 p-4 rounded-lg z-[1000]">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                PRECIPITATION
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">145mm</div>
              <div className="text-xs text-gray-300">Heavy Rain Warning</div>
            </div>
          </div>
        </div>

        {/* Side Panel (1 col) */}
        <div className="flex flex-col gap-4">
          {/* District Status */}
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-sm font-bold uppercase text-yellow-400 flex items-center gap-2">
                <ShieldAlert size={18} /> District Status
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {[{
              name: 'Colombo',
              status: 'CRITICAL',
              color: 'text-red-500',
              bg: 'bg-red-600/10 border-red-700'
            }, {
              name: 'Gampaha',
              status: 'WARNING',
              color: 'text-orange-500',
              bg: 'bg-orange-600/10 border-orange-700'
            }, {
              name: 'Kalutara',
              status: 'WATCH',
              color: 'text-blue-400',
              bg: 'bg-blue-600/10 border-blue-700'
            }, {
              name: 'Galle',
              status: 'NORMAL',
              color: 'text-green-500',
              bg: 'bg-green-600/10 border-green-700'
            }, {
              name: 'Matara',
              status: 'NORMAL',
              color: 'text-green-500',
              bg: 'bg-green-600/10 border-green-700'
            }].map((d, i) => <div key={i} className={`flex justify-between items-center p-3 border rounded-lg ${d.bg}`}>
                  <span className="font-bold text-sm text-white">{d.name}</span>
                  <span className={`text-xs font-bold ${d.color}`}>
                    {d.status}
                  </span>
                </div>)}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="h-1/3 bg-gray-800 border border-gray-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
                <Radio size={18} /> Broadcast Feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                <div className="text-xs border-l-4 border-l-red-600 pl-3">
                  <div className="font-semibold text-red-400 mb-1">
                    14:02 • SMS BROADCAST
                  </div>
                  <div className="text-gray-300">
                    Evacuation order issued for Sector 7. Immediate compliance required.
                  </div>
                </div>
                <div className="text-xs border-l-4 border-l-orange-500 pl-3">
                  <div className="font-semibold text-orange-400 mb-1">
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