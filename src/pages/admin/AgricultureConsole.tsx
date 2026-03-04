import React from 'react';
import { Sprout, CloudRain, Droplets, Tractor, AlertTriangle, TrendingDown } from 'lucide-react';
export function AgricultureConsole() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Agriculture & Livelihood Command
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            CROP RISK ANALYSIS • SEASON: MAHA 2024
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-sm hover:bg-yellow-500 flex items-center gap-2 rounded transition-colors">
            <AlertTriangle size={18} /> Issue Farmer Advisory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-red-600 p-6 rounded-lg">
              <div className="text-sm text-gray-400 uppercase font-bold mb-1">
                Total Crop Exposure
              </div>
              <div className="text-2xl font-bold text-red-600">
                45,200 Ha
              </div>
              <div className="text-[10px] text-red-600">High Risk Zone</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-blue-400 p-6 rounded-lg">
              <div className="text-sm text-gray-400 uppercase font-bold mb-1">
                Farmers Affected
              </div>
              <div className="text-2xl font-bold text-white">
                12,850
              </div>
              <div className="text-[10px] text-gray-400">Est. Households</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-yellow-400 p-6 rounded-lg">
              <div className="text-sm text-gray-400 uppercase font-bold mb-1">
                Proj. Economic Loss
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                LKR 450M
              </div>
              <div className="text-[10px] text-yellow-400">-15% Yield</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] flex flex-col rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
              <Sprout size={18} /> Crop Risk Map
            </h3>
            <div className="flex-1 bg-gray-950 border border-gray-700 flex items-center justify-center text-gray-600 text-xs font-semibold relative rounded">
              [SATELLITE CROP HEALTH LAYER]
              <div className="absolute bottom-4 right-4 bg-gray-900/90 p-2 border border-gray-700 rounded">
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-red-600"></span> Inundated
                  (&gt;1m)
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-yellow-400"></span> Waterlogged
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-green-500"></span> Safe
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-4">
              Priority Districts
            </h3>
            <div className="space-y-3">
              {[{
              name: 'Polonnaruwa',
              crop: 'Paddy',
              risk: 'Critical',
              depth: '1.2m'
            }, {
              name: 'Anuradhapura',
              crop: 'Paddy',
              risk: 'High',
              depth: '0.8m'
            }, {
              name: 'Kurunegala',
              crop: 'Vegetable',
              risk: 'Moderate',
              depth: '0.4m'
            }].map((d, i) => <div key={i} className="p-4 bg-gray-900 border border-gray-700 round rounded">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">
                      {d.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${d.risk === 'Critical' ? 'text-red-600' : d.risk === 'High' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {d.risk}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{d.crop}</span>
                    <span>Est. Depth: {d.depth}</span>
                  </div>
                </div>)}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Relief Planning
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Seed Distribution</span>
                  <span className="text-blue-400">45%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-blue-400 h-full rounded" style={{
                  width: '45%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Compensation Fund</span>
                  <span className="text-yellow-400">12%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-yellow-400 h-full rounded" style={{
                  width: '12%'
                }}></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 border border-gray-700 text-sm font-bold uppercase text-gray-300 hover:bg-gray-700 rounded transition-colors">
              Manage Relief
            </button>
          </div>
        </div>
      </div>
    </div>;
}