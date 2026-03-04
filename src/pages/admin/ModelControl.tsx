import React from 'react';
import { Activity, GitBranch, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
const predictionData = [{
  time: '00:00',
  actual: 12,
  predicted: 14
}, {
  time: '04:00',
  actual: 18,
  predicted: 16
}, {
  time: '08:00',
  actual: 45,
  predicted: 42
}, {
  time: '12:00',
  actual: 68,
  predicted: 75
}, {
  time: '16:00',
  actual: 55,
  predicted: 60
}, {
  time: '20:00',
  actual: 30,
  predicted: 35
}];
export function ModelControl() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            AI Model Operations
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            MODEL: FLOODNET-V2.1 • STATUS: ACTIVE
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-blue-400 font-bold uppercase text-sm flex items-center gap-2 rounded-lg transition-colors">
            <RefreshCw size={18} /> Retrain
          </button>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm flex items-center gap-2 rounded-lg transition-colors">
            <Play size={18} /> Run Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6 h-[400px]">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex justify-between">
            <span>Prediction Accuracy (24h)</span>
            <span className="text-green-500">94.2% ACCURACY</span>
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictionData}>
              <defs>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" tick={{
              fill: '#9CA3AF',
              fontSize: 11
            }} />
              <YAxis stroke="#9CA3AF" tick={{
              fill: '#9CA3AF',
              fontSize: 11
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#F3F4F6'
            }} itemStyle={{
              color: '#2563EB'
            }} />
              <Area type="monotone" dataKey="predicted" stroke="#2563EB" fillOpacity={1} fill="url(#colorPred)" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#F97316" strokeWidth={2} dot={{
              fill: '#F97316'
            }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Controls & Metrics */}
        <div className="space-y-4">
          {/* Health Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <Activity size={18} /> Model Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-gray-300">Confidence Score</span>
                  <span className="text-green-500">98%</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-green-500 h-full transition-all" style={{
                  width: '98%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-gray-300">Data Drift</span>
                  <span className="text-yellow-400">12%</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-yellow-400 h-full transition-all" style={{
                  width: '12%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-gray-300">Latency</span>
                  <span className="text-blue-400">45ms</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-blue-400 h-full transition-all" style={{
                  width: '15%'
                }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Version Control */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <GitBranch size={18} /> Version Control
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
                <div>
                  <div className="text-sm font-bold text-blue-400">
                    v2.1 (Current)
                  </div>
                  <div className="text-xs text-gray-400">
                    Deployed 2h ago
                  </div>
                </div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg opacity-60">
                <div>
                  <div className="text-sm font-bold text-gray-400">v2.0</div>
                  <div className="text-xs text-gray-500">Archived</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-red-600/10 border border-red-600 rounded-xl p-6">
            <div className="flex gap-3">
              <AlertTriangle className="text-red-600 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold text-red-600 uppercase mb-1">
                  Drift Warning
                </h4>
                <p className="text-xs text-gray-300 leading-tight">
                  Significant deviation detected in rainfall patterns for Zone 4. Recommendation: Retrain with latest sensor data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}