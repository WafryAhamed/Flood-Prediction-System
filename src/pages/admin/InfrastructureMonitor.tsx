import React from 'react';
import { ShieldAlert, Zap, Droplets, Truck, Activity } from 'lucide-react';
export function InfrastructureMonitor() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Critical Infrastructure
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            VULNERABILITY SCAN: COMPLETE • 4 ASSETS AT RISK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF] mb-4">
              Priority Assets at Risk
            </h3>
            <div className="space-y-4">
              {[{
              name: 'Kelani Bridge',
              type: 'Transport',
              risk: 92,
              impact: 'Critical',
              icon: Truck
            }, {
              name: 'Substation 4',
              type: 'Power',
              risk: 78,
              impact: 'High',
              icon: Zap
            }, {
              name: 'Main Drainage Pump A',
              type: 'Water',
              risk: 65,
              impact: 'High',
              icon: Droplets
            }].map((asset, i) => <div key={i} className="flex items-center gap-4 p-3 bg-[#0A1929] border border-[#1E4976]">
                  <div className="w-10 h-10 bg-[#1E4976] flex items-center justify-center text-gray-300">
                    <asset.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-white">
                        {asset.name}
                      </span>
                      <span className="text-xs font-mono-cmd text-[#FF1744]">
                        RISK: {asset.risk}%
                      </span>
                    </div>
                    <div className="w-full bg-[#132F4C] h-1.5 mb-1">
                      <div className="bg-[#FF1744] h-full" style={{
                    width: `${asset.risk}%`
                  }}></div>
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase">
                      Impact: {asset.impact} • Pop. Dependency: 450k
                    </div>
                  </div>
                </div>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-48">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Power Grid Status
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono-cmd">
                [GRID MAP]
              </div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-48">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Water Systems
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono-cmd">
                [PIPE NETWORK]
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Panel */}
        <div className="bg-[#132F4C] border border-[#1E4976] p-4 flex flex-col">
          <h3 className="text-xs font-bold uppercase text-[#FFC107] mb-4 flex items-center gap-2">
            <Activity size={14} /> Impact Simulator
          </h3>

          <div className="space-y-6 flex-1">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">
                Rainfall Increase
              </label>
              <input type="range" className="w-full accent-[#00E5FF]" />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono-cmd">
                <span>Current</span>
                <span>+50%</span>
                <span>+100%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">
                Drainage Efficiency
              </label>
              <input type="range" className="w-full accent-[#00E5FF]" />
            </div>

            <div className="p-4 bg-[#0A1929] border border-[#1E4976] mt-4">
              <h4 className="text-xs font-bold text-white mb-2">
                Projected Failures
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex justify-between">
                  <span>Road Network</span>
                  <span className="text-[#FF1744]">32% Blocked</span>
                </li>
                <li className="flex justify-between">
                  <span>Power Outage</span>
                  <span className="text-[#FFC107]">12k Households</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-2 bg-[#00E5FF] text-black font-bold uppercase text-xs hover:bg-[#00B8D4]">
              Run Simulation
            </button>
          </div>
        </div>
      </div>
    </div>;
}