import React from 'react';
import { Hammer, Truck, HeartHandshake, FileText, CheckCircle } from 'lucide-react';
export function RecoveryCommand() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Post-Flood Recovery
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            PHASE 2: RESTORATION • DAY 4
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#00E676] text-black font-bold uppercase text-xs hover:bg-[#00C853] flex items-center gap-2">
            <FileText size={14} /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#132F4C] border border-[#1E4976] p-6">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF] mb-6">
              National Restoration Progress
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Truck size={16} /> Road Network
                  </span>
                  <span className="font-mono-cmd text-[#00E676]">85%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#00E676] h-full" style={{
                  width: '85%'
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Hammer size={16} /> Power Grid
                  </span>
                  <span className="font-mono-cmd text-[#FFC107]">62%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#FFC107] h-full" style={{
                  width: '62%'
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <HeartHandshake size={16} /> Aid Distribution
                  </span>
                  <span className="font-mono-cmd text-[#00E5FF]">45%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#00E5FF] h-full" style={{
                  width: '45%'
                }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-64">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Damage Assessment Map
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono-cmd bg-[#050B14] border border-[#1E4976]">
                [HEATMAP]
              </div>
            </div>
            <div className="bg-[#132F4C] border border-[#1E4976] p-4 h-64">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                Community Needs
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono-cmd bg-[#050B14] border border-[#1E4976]">
                [CLUSTER MAP]
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
              Pending Approvals
            </h3>
            <div className="space-y-3">
              {[{
              item: 'Road Repair Budget: Zone 4',
              status: 'Pending',
              req: 'LKR 2.5M'
            }, {
              item: 'School Reopening: Gampaha',
              status: 'Review',
              req: 'Safety Check'
            }, {
              item: 'Medical Camp Deployment',
              status: 'Urgent',
              req: 'Personnel'
            }].map((task, i) => <div key={i} className="p-3 bg-[#0A1929] border border-[#1E4976] flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {task.item}
                    </div>
                    <div className="text-[10px] text-gray-400">{task.req}</div>
                  </div>
                  <button className="p-1 hover:bg-[#00E676]/20 text-[#00E676] rounded">
                    <CheckCircle size={16} />
                  </button>
                </div>)}
            </div>
          </div>

          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
              Public Notices
            </h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-[#0A1929] border border-[#1E4976] text-xs font-bold text-gray-300 hover:text-white text-left px-3">
                + Draft New Bulletin
              </button>
              <div className="p-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[10px] text-[#00E5FF]">
                Active: "Safe Water Guidelines" (Sent 2h ago)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}