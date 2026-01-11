import React, { useState } from 'react';
import { RiskMap } from '../components/RiskMap';
import { Layers, Filter, Map as MapIcon } from 'lucide-react';
export function RiskMapPage() {
  const [activeLayers, setActiveLayers] = useState(['flood', 'reports']);
  const layers = [{
    id: 'flood',
    label: 'Flood Risk',
    color: 'bg-red-500'
  }, {
    id: 'reports',
    label: 'Community Reports',
    color: 'bg-orange-500'
  }, {
    id: 'evac',
    label: 'Evacuation Centers',
    color: 'bg-green-500'
  }, {
    id: 'infra',
    label: 'Infrastructure',
    color: 'bg-blue-500'
  }, {
    id: 'agri',
    label: 'Agriculture',
    color: 'bg-yellow-500'
  }];
  const toggleLayer = (id: string) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };
  return <div className="h-screen pt-16 md:pt-0 md:pl-64 flex flex-col relative">
      {/* Map Controls Overlay */}
      <div className="absolute top-20 left-4 z-[1000] md:top-4 md:left-68 flex flex-col gap-2">
        <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase text-sm mb-2 flex items-center gap-2">
            <Layers size={16} /> Map Layers
          </h3>
          <div className="flex flex-col gap-1">
            {layers.map(layer => <button key={layer.id} onClick={() => toggleLayer(layer.id)} className={`
                  flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase border-2 border-black transition-all
                  ${activeLayers.includes(layer.id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}
                `}>
                <div className={`w-3 h-3 ${layer.color} border border-white`}></div>
                {layer.label}
              </button>)}
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full bg-gray-200 relative">
        <RiskMap />

        {/* Bottom Legend */}
        <div className="absolute bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 bg-white border-4 border-black p-4 z-[1000] max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="font-black uppercase text-lg mb-2">Live Situation</h4>
          <p className="text-sm font-bold text-gray-600 mb-3">
            Updated 5 mins ago • 12 Active Reports
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 border-2 border-black"></span>
              <span className="text-xs font-bold uppercase">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-500 border-2 border-black"></span>
              <span className="text-xs font-bold uppercase">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 border-2 border-black"></span>
              <span className="text-xs font-bold uppercase">Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
}