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
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            District Command
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            SELECT DISTRICT FOR DETAILED INTEL
          </p>
        </div>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="bg-[#132F4C] border border-[#1E4976] text-white px-4 py-2 font-bold uppercase text-xs focus:border-[#00E5FF] outline-none">
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
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Current Risk
              </div>
              <div className="text-3xl font-mono-cmd font-bold text-[#FF1744]">
                CRITICAL
              </div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Population Exposed
              </div>
              <div className="text-3xl font-mono-cmd font-bold text-white">
                2.3M
              </div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">
                Shelter Status
              </div>
              <div className="text-3xl font-mono-cmd font-bold text-[#FFC107]">
                82%
              </div>
            </div>
          </div>

          <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-64">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Risk Trend (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF1744" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF1744" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="risk" stroke="#FF1744" fillOpacity={1} fill="url(#colorRisk)" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
                High Priority Zones
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Zone A (Coastal)</span>
                  <span className="text-[#FF1744] font-bold">EVACUATE</span>
                </li>
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Zone B (Urban)</span>
                  <span className="text-[#FFC107] font-bold">ALERT</span>
                </li>
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Zone C (Inland)</span>
                  <span className="text-[#00E676] font-bold">SAFE</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
                Resource Allocation
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Boats</span>
                  <span className="font-mono-cmd">12/15</span>
                </li>
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Trucks</span>
                  <span className="font-mono-cmd">8/10</span>
                </li>
                <li className="flex justify-between border-b border-[#1E4976] pb-1">
                  <span>Personnel</span>
                  <span className="font-mono-cmd">145</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-64 flex flex-col">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
              <Map size={14} /> District Map
            </h3>
            <div className="flex-1 bg-[#050B14] border border-[#1E4976] flex items-center justify-center text-gray-600 text-xs font-mono-cmd">
              [DISTRICT MAP]
            </div>
          </div>

          <button className="w-full py-3 bg-[#00E5FF] text-black font-bold uppercase text-sm hover:bg-[#00B8D4]">
            Generate Briefing (PDF)
          </button>

          <button className="w-full py-3 bg-[#132F4C] border border-[#FF1744] text-[#FF1744] font-bold uppercase text-sm hover:bg-[#FF1744]/10">
            Declare Emergency
          </button>
        </div>
      </div>
    </div>;
}