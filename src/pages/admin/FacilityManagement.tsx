import React from 'react';
import { Building2, Plus, AlertTriangle, Users, MapPin, Bus } from 'lucide-react';
export function FacilityManagement() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Evacuation Operations
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            NETWORK STATUS: 85% OPERATIONAL • 12 ACTIVE SHELTERS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#00E5FF] text-black font-bold uppercase text-xs hover:bg-[#00B8D4] flex items-center gap-2">
            <Plus size={14} /> Activate New Shelter
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#132F4C] border border-[#1E4976] p-4">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">
            Total Capacity
          </div>
          <div className="text-2xl font-mono-cmd font-bold text-white">
            12,500
          </div>
          <div className="text-[10px] text-[#00E676]">85% Available</div>
        </div>
        <div className="bg-[#132F4C] border border-[#1E4976] p-4">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">
            Current Occupancy
          </div>
          <div className="text-2xl font-mono-cmd font-bold text-[#FFC107]">
            1,842
          </div>
          <div className="text-[10px] text-[#FFC107]">+120 last hour</div>
        </div>
        <div className="bg-[#132F4C] border border-[#1E4976] p-4">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">
            At Risk Facilities
          </div>
          <div className="text-2xl font-mono-cmd font-bold text-[#FF1744]">
            3
          </div>
          <div className="text-[10px] text-[#FF1744]">Flood imminent</div>
        </div>
        <div className="bg-[#132F4C] border border-[#1E4976] p-4">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">
            Transport Units
          </div>
          <div className="text-2xl font-mono-cmd font-bold text-[#00E5FF]">
            24
          </div>
          <div className="text-[10px] text-[#00E5FF]">Active on routes</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility List */}
        <div className="lg:col-span-2 space-y-4">
          {[{
          name: 'Base Hospital Gampaha',
          type: 'Hospital',
          status: 'Operational',
          cap: 85,
          risk: 'Low'
        }, {
          name: "St. Mary's College",
          type: 'Evac Center',
          status: 'Active',
          cap: 40,
          risk: 'Moderate'
        }, {
          name: 'Public Library Hall',
          type: 'Evac Center',
          status: 'Standby',
          cap: 0,
          risk: 'Low'
        }, {
          name: 'Temple of the Tooth Shelter',
          type: 'Evac Center',
          status: 'Active',
          cap: 92,
          risk: 'High'
        }].map((f, i) => <div key={i} className="bg-[#132F4C] border border-[#1E4976] p-4 flex items-center gap-4 hover:border-[#00E5FF] transition-colors group">
              <div className={`w-12 h-12 flex items-center justify-center border ${f.risk === 'High' ? 'bg-[#FF1744]/10 border-[#FF1744] text-[#FF1744]' : 'bg-[#0A1929] border-[#1E4976] text-[#00E5FF]'}`}>
                <Building2 size={24} />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white group-hover:text-[#00E5FF]">
                    {f.name}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${f.status === 'Active' ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-gray-700 text-gray-300'}`}>
                    {f.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> Sector 4
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus size={12} /> Route A-12
                  </span>
                  {f.risk === 'High' && <span className="text-[#FF1744] font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> HIGH RISK
                    </span>}
                </div>

                <div className="w-full bg-[#0A1929] h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${f.cap > 90 ? 'bg-[#FF1744]' : f.cap > 70 ? 'bg-[#FFC107]' : 'bg-[#00E5FF]'}`} style={{
                width: `${f.cap}%`
              }}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-mono-cmd">
                  <span className="text-gray-500">Occupancy</span>
                  <span className={f.cap > 90 ? 'text-[#FF1744]' : 'text-gray-300'}>
                    {f.cap}% Full
                  </span>
                </div>
              </div>

              <button className="px-3 py-1 border border-[#1E4976] text-xs font-bold uppercase text-gray-300 hover:bg-[#1E4976]">
                Manage
              </button>
            </div>)}
        </div>

        {/* Map/Alerts Panel */}
        <div className="space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-64 flex flex-col">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
              <MapPin size={14} /> Shelter Map
            </h3>
            <div className="flex-1 bg-[#050B14] border border-[#1E4976] flex items-center justify-center text-gray-600 text-xs font-mono-cmd">
              [MAP VISUALIZATION]
            </div>
          </div>

          <div className="bg-[#FF1744]/10 border border-[#FF1744] p-4">
            <h3 className="text-xs font-bold uppercase text-[#FF1744] mb-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Critical Alerts
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex gap-2 text-gray-300">
                <span className="text-[#FF1744] font-bold">•</span>
                Temple Shelter approaching max capacity (92%)
              </li>
              <li className="flex gap-2 text-gray-300">
                <span className="text-[#FF1744] font-bold">•</span>
                Access road to Hospital blocked by water
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>;
}