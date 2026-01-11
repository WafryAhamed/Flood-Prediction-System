import React from 'react';
import { Check, X, MapPin, MessageSquare, AlertTriangle, Filter } from 'lucide-react';
export function ReportModeration() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Community Intelligence Hub
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            INCOMING STREAM • 12 NEW REPORTS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-[#132F4C] border border-[#1E4976] text-gray-300 text-xs font-bold uppercase hover:bg-[#1E4976] flex items-center gap-2">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Queue List */}
        <div className="lg:col-span-1 bg-[#132F4C] border border-[#1E4976] flex flex-col">
          <div className="p-3 border-b border-[#1E4976] bg-[#0A1929] flex justify-between">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF]">
              Priority Queue
            </h3>
            <span className="text-xs font-mono-cmd text-[#FF1744]">
              4 CRITICAL
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`p-3 border ${i === 1 ? 'bg-[#FF1744]/10 border-[#FF1744]' : 'bg-[#0A1929] border-[#1E4976] hover:border-[#00E5FF]'} cursor-pointer transition-colors`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase px-1 ${i === 1 ? 'bg-[#FF1744] text-white' : 'bg-[#1E4976] text-gray-300'}`}>
                    {i === 1 ? 'CRITICAL' : 'MEDIUM'}
                  </span>
                  <span className="text-[10px] font-mono-cmd text-gray-400">
                    2m ago
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-200 mb-1">
                  Flood water entering homes, need rescue.
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <MapPin size={10} /> Kelaniya, Gampaha
                </div>
              </div>)}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-[#132F4C] border border-[#1E4976] flex flex-col">
          <div className="p-4 border-b border-[#1E4976] bg-[#0A1929] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">
                U
              </div>
              <div>
                <div className="text-sm font-bold text-white">User #8492</div>
                <div className="text-[10px] text-[#00E676] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>{' '}
                  TRUST SCORE: 92%
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#00E676] text-black font-bold uppercase text-xs hover:bg-[#00C853] flex items-center gap-2">
                <Check size={14} /> Verify
              </button>
              <button className="px-4 py-2 bg-[#FF1744] text-white font-bold uppercase text-xs hover:bg-[#D50000] flex items-center gap-2">
                <X size={14} /> Reject
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black h-48 border border-[#1E4976] flex items-center justify-center text-gray-500 text-xs uppercase">
                [Media Placeholder]
              </div>
              <div className="bg-black h-48 border border-[#1E4976] flex items-center justify-center text-gray-500 text-xs uppercase">
                [Map Location Placeholder]
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0A1929] p-4 border border-[#1E4976]">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">
                  Report Content
                </h4>
                <p className="text-sm text-gray-200">
                  "Water level has risen significantly in the last 30 minutes.
                  The road is completely blocked. We are moving to the second
                  floor."
                </p>
              </div>

              <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/30 p-4">
                <h4 className="text-xs font-bold uppercase text-[#00E5FF] mb-2 flex items-center gap-2">
                  <Activity size={14} /> AI Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Veracity Score</span>
                    <span className="text-white font-mono-cmd font-bold">
                      94% (High Confidence)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Location Match</span>
                    <span className="text-white font-mono-cmd font-bold">
                      Consistent with Satellite
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Nearby Reports</span>
                    <span className="text-white font-mono-cmd font-bold">
                      3 similar in 500m radius
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}