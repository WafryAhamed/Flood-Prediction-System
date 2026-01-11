import React from 'react';
import { Sprout, CloudRain, Droplets, Tractor, AlertTriangle, TrendingDown } from 'lucide-react';
export function AgricultureConsole() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Agriculture & Livelihood Command
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            CROP RISK ANALYSIS • SEASON: MAHA 2024
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#FFC107] text-black font-bold uppercase text-xs hover:bg-[#FFD54F] flex items-center gap-2">
            <AlertTriangle size={14} /> Issue Farmer Advisory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Total Crop Exposure
              </div>
              <div className="text-2xl font-mono-cmd font-bold text-[#FF1744]">
                45,200 Ha
              </div>
              <div className="text-[10px] text-[#FF1744]">High Risk Zone</div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Farmers Affected
              </div>
              <div className="text-2xl font-mono-cmd font-bold text-white">
                12,850
              </div>
              <div className="text-[10px] text-gray-400">Est. Households</div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Proj. Economic Loss
              </div>
              <div className="text-2xl font-mono-cmd font-bold text-[#FFC107]">
                LKR 450M
              </div>
              <div className="text-[10px] text-[#FFC107]">-15% Yield</div>
            </div>
          </div>

          <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-[400px] flex flex-col">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
              <Sprout size={14} /> Crop Risk Map
            </h3>
            <div className="flex-1 bg-[#050B14] border border-[#1E4976] flex items-center justify-center text-gray-600 text-xs font-mono-cmd relative">
              [SATELLITE CROP HEALTH LAYER]
              <div className="absolute bottom-4 right-4 bg-[#0A1929]/90 p-2 border border-[#1E4976]">
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-[#FF1744]"></span> Inundated
                  (&gt;1m)
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-[#FFC107]"></span> Waterlogged
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-[#00E676]"></span> Safe
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF] mb-4">
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
            }].map((d, i) => <div key={i} className="p-3 bg-[#0A1929] border border-[#1E4976]">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">
                      {d.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${d.risk === 'Critical' ? 'text-[#FF1744]' : d.risk === 'High' ? 'text-[#FFC107]' : 'text-[#00E5FF]'}`}>
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

          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
              Relief Planning
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Seed Distribution</span>
                  <span className="text-[#00E5FF]">45%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-1.5">
                  <div className="bg-[#00E5FF] h-full" style={{
                  width: '45%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Compensation Fund</span>
                  <span className="text-[#FFC107]">12%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-1.5">
                  <div className="bg-[#FFC107] h-full" style={{
                  width: '12%'
                }}></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 border border-[#1E4976] text-xs font-bold uppercase text-gray-300 hover:bg-[#1E4976]">
              Manage Relief
            </button>
          </div>
        </div>
      </div>
    </div>;
}