import React from 'react';
import { Hammer, Truck, HeartHandshake, FileText, CheckCircle } from 'lucide-react';
export function RecoveryCommand() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Post-Flood Recovery
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            PHASE 2: RESTORATION • DAY 4
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-green-500 text-black font-bold uppercase text-sm hover:bg-green-600 flex items-center gap-2 rounded transition-colors">
            <FileText size={18} /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-6">
              National Restoration Progress
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Truck size={16} /> Road Network
                  </span>
                  <span className="font-semibold text-green-500">85%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{
                  width: '85%'
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Hammer size={16} /> Power Grid
                  </span>
                  <span className="font-semibold text-yellow-400">62%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full" style={{
                  width: '62%'
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <HeartHandshake size={16} /> Aid Distribution
                  </span>
                  <span className="font-semibold text-blue-400">45%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full" style={{
                  width: '45%'
                }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 h-64 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Damage Assessment Map
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold bg-gray-950 border border-gray-700 rounded">
                [HEATMAP]
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 h-64 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Community Needs
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold bg-gray-950 border border-gray-700 rounded">
                [CLUSTER MAP]
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
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
            }].map((task, i) => <div key={i} className="p-4 bg-gray-900 border border-gray-700 flex justify-between items-center rounded">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {task.item}
                    </div>
                    <div className="text-[10px] text-gray-400">{task.req}</div>
                  </div>
                  <button className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors">
                    <CheckCircle size={16} />
                  </button>
                </div>)}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Public Notices
            </h3>
            <div className="space-y-2">
              <button className="w-full py-3 bg-gray-900 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white text-left px-3 rounded transition-colors">
                + Draft New Bulletin
              </button>
              <div className="p-2 bg-blue-400/10 border border-blue-400/30 text-[10px] text-blue-400 rounded">
                Active: "Safe Water Guidelines" (Sent 2h ago)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}