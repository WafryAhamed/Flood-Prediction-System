import React, { useState } from 'react';
import { Map, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
const data = [{
  name: 'Mon',
  risk: 40
}, {
  name: 'Tue',
  risk: 30
}, {
  name: 'Wed',
  risk: 20
}, {
  name: 'Thu',
  risk: 27
}, {
  name: 'Fri',
  risk: 18
}, {
  name: 'Sat',
  risk: 23
}, {
  name: 'Sun',
  risk: 34
}];
export function DistrictControl() {
  const [selectedDistrict, setSelectedDistrict] = useState('Colombo');
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            District Command
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            SELECT DISTRICT FOR DETAILED INTEL
          </p>
        </div>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="bg-gray-800 border border-gray-700 text-white px-4 py-3 font-bold uppercase text-sm focus:border-blue-400 outline-none rounded-lg transition-colors">
          <option>Colombo</option>
          <option>Gampaha</option>
          <option>Kalutara</option>
          <option>Galle</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-red-600">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Current Risk
              </div>
              <div className="text-3xl font-bold text-red-600">
                CRITICAL
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-blue-400">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Population Exposed
              </div>
              <div className="text-3xl font-bold text-white">
                2.3M
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-yellow-400">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Shelter Status
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                82%
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-64">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Risk Trend (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="risk" stroke="#DC2626" fillOpacity={1} fill="url(#colorRisk)" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
                High Priority Zones
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Zone A (Coastal)</span>
                  <span className="text-red-600 font-bold">EVACUATE</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Zone B (Urban)</span>
                  <span className="text-yellow-400 font-bold">ALERT</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Zone C (Inland)</span>
                  <span className="text-green-600 font-bold">SAFE</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
                Resource Allocation
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Boats</span>
                  <span className="font-semibold">12/15</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Trucks</span>
                  <span className="font-semibold">8/10</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Personnel</span>
                  <span className="font-semibold">145</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-64 flex flex-col">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
              <Map size={18} /> District Map
            </h3>
            <div className="flex-1 bg-gray-950 border border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs font-semibold">
              [DISTRICT MAP]
            </div>
          </div>

          <button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm rounded-lg transition-colors">
            Generate Briefing (PDF)
          </button>

          <button className="w-full py-3 px-6 bg-gray-800 border border-red-600 text-red-600 font-bold uppercase text-sm hover:bg-red-600/10 rounded-lg transition-colors">
            Declare Emergency
          </button>
        </div>
      </div>
    </div>;
}