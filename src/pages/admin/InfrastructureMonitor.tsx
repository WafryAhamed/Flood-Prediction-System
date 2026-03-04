import React from 'react';
import { ShieldAlert, Zap, Droplets, Truck, Activity } from 'lucide-react';
export function InfrastructureMonitor() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Critical Infrastructure
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            VULNERABILITY SCAN: COMPLETE • 4 ASSETS AT RISK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-4">
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
            }].map((asset, i) => <div key={i} className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-700 border-l-4 border-l-red-600 rounded">
                  <div className="w-10 h-10 bg-gray-700 flex items-center justify-center text-gray-300">
                    <asset.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-white">
                        {asset.name}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        RISK: {asset.risk}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 mb-1">
                      <div className="bg-red-600 h-full" style={{
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
            <div className="bg-gray-800 border border-gray-700 p-6 h-48 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Power Grid Status
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold">
                [GRID MAP]
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 h-48 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Water Systems
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold">
                [PIPE NETWORK]
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Panel */}
        <div className="bg-gray-800 border border-gray-700 p-6 flex flex-col rounded-lg">
          <h3 className="text-sm font-bold uppercase text-yellow-400 mb-4 flex items-center gap-2">
            <Activity size={18} /> Impact Simulator
          </h3>

          <div className="space-y-6 flex-1">
            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">
                Rainfall Increase
              </label>
              <input type="range" className="w-full accent-blue-400" />
              <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                <span>Current</span>
                <span>+50%</span>
                <span>+100%</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">
                Drainage Efficiency
              </label>
              <input type="range" className="w-full accent-blue-400" />
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 mt-4 rounded">
              <h4 className="text-sm font-bold text-white mb-2">
                Projected Failures
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex justify-between">
                  <span>Road Network</span>
                  <span className="text-red-600">32% Blocked</span>
                </li>
                <li className="flex justify-between">
                  <span>Power Outage</span>
                  <span className="text-yellow-400">12k Households</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-3 bg-blue-400 text-black font-bold uppercase text-sm hover:bg-blue-500 rounded transition-colors">
              Run Simulation
            </button>
          </div>
        </div>
      </div>
    </div>;
}