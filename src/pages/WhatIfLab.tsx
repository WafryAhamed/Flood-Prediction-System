import React, { useState } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import { RiskIndicator } from '../components/ui/RiskIndicator';
export function WhatIfLab() {
  const [params, setParams] = useState({
    rainfall: 50,
    drainage: 50,
    urbanization: 50
  });
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-widest mb-2">
              Simulation Mode
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-none">
              What-If
              <br />
              Lab
            </h1>
          </div>
          <button onClick={() => setParams({
          rainfall: 50,
          drainage: 50,
          urbanization: 50
        })} className="flex items-center gap-2 font-bold uppercase hover:underline">
            <RefreshCw size={16} /> Reset Defaults
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-8 bg-white border-4 border-black p-6">
            <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
              <Sliders strokeWidth={3} /> Variables
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-bold uppercase">
                    Rainfall Intensity
                  </label>
                  <span className="font-mono font-bold">
                    {params.rainfall}%
                  </span>
                </div>
                <input type="range" min="0" max="100" value={params.rainfall} onChange={e => setParams({
                ...params,
                rainfall: parseInt(e.target.value)
              })} className="w-full h-4 bg-gray-200 appearance-none cursor-pointer accent-black" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-bold uppercase">
                    Drainage Capacity
                  </label>
                  <span className="font-mono font-bold">
                    {params.drainage}%
                  </span>
                </div>
                <input type="range" min="0" max="100" value={params.drainage} onChange={e => setParams({
                ...params,
                drainage: parseInt(e.target.value)
              })} className="w-full h-4 bg-gray-200 appearance-none cursor-pointer accent-black" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-bold uppercase">Urban Density</label>
                  <span className="font-mono font-bold">
                    {params.urbanization}%
                  </span>
                </div>
                <input type="range" min="0" max="100" value={params.urbanization} onChange={e => setParams({
                ...params,
                urbanization: parseInt(e.target.value)
              })} className="w-full h-4 bg-gray-200 appearance-none cursor-pointer accent-black" />
              </div>
            </div>

            <div className="bg-gray-100 p-4 border-2 border-black mt-8">
              <p className="text-sm font-bold text-gray-600 uppercase">
                AI Model: Surrogate-v2.1
                <br />
                Confidence: 94%
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 space-y-6">
            <RiskIndicator level={params.rainfall > 80 && params.drainage < 40 ? 'CRITICAL' : params.rainfall > 60 ? 'HIGH' : params.rainfall > 40 ? 'MODERATE' : 'LOW'} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-4 border-black p-6 bg-white">
                <h4 className="font-black uppercase text-lg mb-4">
                  Projected Impact
                </h4>
                <ul className="space-y-3">
                  <li className="flex justify-between border-b-2 border-gray-100 pb-2">
                    <span className="font-bold">Households Affected</span>
                    <span className="font-mono font-black text-xl">
                      {Math.round(params.rainfall * params.urbanization / 10)}
                    </span>
                  </li>
                  <li className="flex justify-between border-b-2 border-gray-100 pb-2">
                    <span className="font-bold">Roads Submerged</span>
                    <span className="font-mono font-black text-xl">
                      {Math.round(params.rainfall / 5)} km
                    </span>
                  </li>
                  <li className="flex justify-between border-b-2 border-gray-100 pb-2">
                    <span className="font-bold">Economic Loss</span>
                    <span className="font-mono font-black text-xl">
                      ${Math.round(params.rainfall * params.urbanization * 100)}
                      k
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-4 border-black p-6 bg-black text-white">
                <h4 className="font-black uppercase text-lg mb-4">
                  Mitigation Advice
                </h4>
                <p className="font-bold leading-relaxed">
                  {params.drainage < 30 ? 'URGENT: Drainage capacity is insufficient for this rainfall level. Immediate clearing required.' : 'Current infrastructure can handle this load, but monitor low-lying areas.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}