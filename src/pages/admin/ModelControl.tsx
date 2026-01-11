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
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            AI Model Operations
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            MODEL: FLOODNET-V2.1 • STATUS: ACTIVE
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#132F4C] border border-[#1E4976] text-[#00E5FF] font-bold uppercase text-xs hover:bg-[#1E4976] flex items-center gap-2">
            <RefreshCw size={14} /> Retrain
          </button>
          <button className="px-4 py-2 bg-[#00E5FF] text-black font-bold uppercase text-xs hover:bg-[#00B8D4] flex items-center gap-2">
            <Play size={14} /> Run Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#132F4C] border border-[#1E4976] p-4 h-[400px]">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex justify-between">
            <span>Prediction Accuracy (24h)</span>
            <span className="text-[#00E676]">94.2% ACCURACY</span>
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictionData}>
              <defs>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E4976" />
              <XAxis dataKey="time" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#0A1929',
              borderColor: '#1E4976',
              color: '#E0E0E0'
            }} itemStyle={{
              color: '#00E5FF'
            }} />
              <Area type="monotone" dataKey="predicted" stroke="#00E5FF" fillOpacity={1} fill="url(#colorPred)" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#FFC107" strokeWidth={2} dot={{
              fill: '#FFC107'
            }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Controls & Metrics */}
        <div className="space-y-4">
          {/* Health Panel */}
          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <Activity size={14} /> Model Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Confidence Score</span>
                  <span className="text-[#00E676]">98%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-2">
                  <div className="bg-[#00E676] h-full" style={{
                  width: '98%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Data Drift</span>
                  <span className="text-[#FFC107]">12%</span>
                </div>
                <div className="w-full bg-[#0A1929] h-2">
                  <div className="bg-[#FFC107] h-full" style={{
                  width: '12%'
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Latency</span>
                  <span className="text-[#00E5FF]">45ms</span>
                </div>
                <div className="w-full bg-[#0A1929] h-2">
                  <div className="bg-[#00E5FF] h-full" style={{
                  width: '15%'
                }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Version Control */}
          <div className="bg-[#132F4C] border border-[#1E4976] p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <GitBranch size={14} /> Version Control
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-[#00E5FF]/10 border border-[#00E5FF] rounded">
                <div>
                  <div className="text-xs font-bold text-[#00E5FF]">
                    v2.1 (Current)
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Deployed 2h ago
                  </div>
                </div>
                <div className="w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0A1929] border border-[#1E4976] rounded opacity-60">
                <div>
                  <div className="text-xs font-bold text-gray-400">v2.0</div>
                  <div className="text-[10px] text-gray-500">Archived</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-[#FF1744]/10 border border-[#FF1744] p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-[#FF1744] shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold text-[#FF1744] uppercase mb-1">
                  Drift Warning
                </h4>
                <p className="text-[10px] text-gray-300 leading-tight">
                  Significant deviation detected in rainfall patterns for Zone
                  4. Recommendation: Retrain with latest sensor data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}