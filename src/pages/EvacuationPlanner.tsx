import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Navigation, AlertTriangle, Home, Flag } from 'lucide-react';
import { StatusCard } from '../components/ui/StatusCard';
export function EvacuationPlanner() {
  const [routeActive, setRouteActive] = useState(false);
  // Mock route data
  const route = [[51.505, -0.09], [51.51, -0.1], [51.51, -0.12]];
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-2">
              Evacuation
              <br />
              Planner
            </h1>
            <p className="font-bold text-gray-600">
              Find the safest route to higher ground.
            </p>
          </div>
          {!routeActive ? <button onClick={() => setRouteActive(true)} className="bg-[#FF0000] text-white px-8 py-4 text-xl font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3">
              <Navigation strokeWidth={3} /> Find Safe Route
            </button> : <div className="bg-black text-white px-6 py-3 font-bold uppercase border-4 border-black">
              Route Active • 1.2km • 15 mins
            </div>}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Controls & Info */}
          <div className="lg:col-span-1 space-y-6">
            <StatusCard title="Route Settings" accentColor="black">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase">
                    Avoid Water &gt; 1ft
                  </span>
                  <div className="w-12 h-6 bg-black rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase">Wheelchair Safe</span>
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase">Elderly Friendly</span>
                  <div className="w-12 h-6 bg-black rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </StatusCard>

            {routeActive && <StatusCard title="Directions" accentColor="green">
                <ol className="list-decimal list-inside space-y-3 font-bold">
                  <li className="pl-2">Head North on Main St (200m)</li>
                  <li className="pl-2">Turn Right onto High Ground Rd</li>
                  <li className="pl-2 text-[#FF0000]">CAUTION: Wet Surface</li>
                  <li className="pl-2">Arrive at Temple Shelter</li>
                </ol>
              </StatusCard>}

            <div className="bg-[#FFCC00] p-4 border-4 border-black">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} strokeWidth={3} />
                <div>
                  <h4 className="font-black uppercase mb-1">Emergency Kit</h4>
                  <p className="text-sm font-bold leading-tight">
                    Don't forget your documents, medicines, and water.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 h-[500px] lg:h-auto border-4 border-black relative">
            <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {routeActive && <>
                  <Polyline positions={route as any} pathOptions={{
                color: 'black',
                weight: 6,
                dashArray: '10, 10'
              }} />
                  <Polyline positions={route as any} pathOptions={{
                color: '#00CC00',
                weight: 3
              }} />
                  <Marker position={[51.505, -0.09]}>
                    <Popup>Start</Popup>
                  </Marker>
                  <Marker position={[51.51, -0.12]}>
                    <Popup>Safe Zone</Popup>
                  </Marker>
                </>}
            </MapContainer>

            {/* Elevation Profile Mockup */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/90 border-t-4 border-black p-2 z-[1000]">
              <span className="text-xs font-black uppercase mb-1 block">
                Elevation Profile
              </span>
              <div className="w-full h-12 bg-gray-100 flex items-end gap-1">
                {[20, 30, 40, 50, 45, 60, 70, 80, 85, 90].map((h, i) => <div key={i} style={{
                height: `${h}%`
              }} className="flex-1 bg-black/20 hover:bg-black transition-colors"></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}