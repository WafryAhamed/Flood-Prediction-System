import React from 'react';
import { StatusCard } from '../../components/ui/StatusCard';
import { AlertTriangle, Users, Activity, Radio } from 'lucide-react';
export function AdminDashboard() {
  return <div className="space-y-6">
      <h2 className="text-3xl font-black uppercase mb-6">
        National Situation Overview
      </h2>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#FF0000] text-white p-6 border-4 border-black">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold uppercase text-sm">
              High Risk Districts
            </span>
            <AlertTriangle size={20} />
          </div>
          <p className="text-5xl font-black">03</p>
        </div>
        <div className="bg-white p-6 border-4 border-black">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold uppercase text-sm">Active Reports</span>
            <MessageSquare size={20} />
          </div>
          <p className="text-5xl font-black">142</p>
        </div>
        <div className="bg-white p-6 border-4 border-black">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold uppercase text-sm">Evacuees</span>
            <Users size={20} />
          </div>
          <p className="text-5xl font-black">8.2k</p>
        </div>
        <div className="bg-black text-white p-6 border-4 border-black">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold uppercase text-sm">System Status</span>
            <Activity size={20} />
          </div>
          <p className="text-2xl font-black uppercase mt-2 text-[#00CC00]">
            Operational
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusCard title="Recent Incidents" className="h-96">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex items-center justify-between border-b-2 border-gray-100 pb-2">
                <div>
                  <span className="bg-red-100 text-red-600 text-xs font-black px-1 uppercase mr-2">
                    Critical
                  </span>
                  <span className="font-bold text-sm">
                    Flash flood reported in Ratnapura
                  </span>
                </div>
                <span className="font-mono text-xs text-gray-500">
                  10:42 AM
                </span>
              </div>)}
          </div>
        </StatusCard>

        <StatusCard title="Resource Deployment" className="h-96">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 font-bold text-sm uppercase">
                <span>Rescue Boats</span>
                <span>12 / 20 Active</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-black">
                <div className="bg-black h-full" style={{
                width: '60%'
              }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 font-bold text-sm uppercase">
                <span>Relief Packs</span>
                <span>4500 / 5000 Dist.</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-black">
                <div className="bg-black h-full" style={{
                width: '90%'
              }}></div>
              </div>
            </div>
          </div>
        </StatusCard>
      </div>
    </div>;
}
function MessageSquare({
  size
}: {
  size: number;
}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>;
}