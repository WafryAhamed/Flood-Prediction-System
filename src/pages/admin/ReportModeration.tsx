import React from 'react';
import { Check, X, MapPin, MessageSquare, AlertTriangle, Filter, Activity } from 'lucide-react';
export function ReportModeration() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Community Intelligence Hub
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            INCOMING STREAM • 12 NEW REPORTS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 text-sm font-bold uppercase hover:bg-gray-600 flex items-center gap-2 rounded-lg transition-colors">
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Queue List */}
        <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-xl flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between">
            <h3 className="text-sm font-bold uppercase text-blue-400">
              Priority Queue
            </h3>
            <span className="text-sm font-semibold text-red-600">
              4 CRITICAL
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`p-3 border rounded-lg ${i === 1 ? 'bg-red-600/10 border-red-600' : 'bg-gray-900 border-gray-700 hover:border-blue-400'} cursor-pointer transition-colors`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${i === 1 ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {i === 1 ? 'CRITICAL' : 'MEDIUM'}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
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
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
                U
              </div>
              <div>
                <div className="text-sm font-bold text-white">User #8492</div>
                <div className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  TRUST SCORE: 92%
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-600 text-white font-bold uppercase text-xs hover:bg-green-700 flex items-center gap-2 rounded-lg transition-colors">
                <Check size={16} /> Verify
              </button>
              <button className="px-4 py-2 bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700 flex items-center gap-2 rounded-lg transition-colors">
                <X size={16} /> Reject
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black h-48 border border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-xs uppercase">
                [Media Placeholder]
              </div>
              <div className="bg-black h-48 border border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-xs uppercase">
                [Map Location Placeholder]
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 p-4 border border-gray-700 rounded-lg">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">
                  Report Content
                </h4>
                <p className="text-sm text-gray-200">
                  "Water level has risen significantly in the last 30 minutes. The road is completely blocked. We are moving to the second floor."
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-xs font-bold uppercase text-blue-400 mb-3 flex items-center gap-2">
                  <Activity size={16} /> AI Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">Veracity Score</span>
                    <span className="text-white font-semibold">94% (High Confidence)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Location Match</span>
                    <span className="text-white font-semibold">Consistent with Satellite</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Nearby Reports</span>
                    <span className="text-white font-semibold">3 similar in 500m radius</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}