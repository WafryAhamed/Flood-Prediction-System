import React, { useMemo } from 'react';
import { Activity, GitBranch, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useReportStore } from '../../stores/reportStore';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import { useWeatherData } from '../../hooks/useWeatherData';

const SEVERITY_SCORE: Record<string, number> = {
  CRITICAL: 26,
  HIGH: 18,
  MEDIUM: 10,
  LOW: 4,
};

export function ModelControl() {
  const reports = useReportStore((s) => s.reports);
  const simulationDefaults = useMaintenanceStore((s) => s.simulationDefaults);
  const { weather } = useWeatherData();

  const predictionData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, idx) => {
      const bucketEnd = new Date(now.getTime() - (5 - idx) * 4 * 60 * 60 * 1000);
      const bucketStart = new Date(bucketEnd.getTime() - 4 * 60 * 60 * 1000);
      const bucketReports = reports.filter((report) => report.timestamp >= bucketStart.getTime() && report.timestamp < bucketEnd.getTime());
      const actual = bucketReports.reduce((sum, report) => sum + (SEVERITY_SCORE[report.severity_level] || 0), 0);
      const weatherFactor = (weather?.rainfall ?? simulationDefaults.rainfall) / 100;
      const drainageFactor = Math.max(0.6, simulationDefaults.drainage / 100);
      const predicted = Math.max(0, Math.round((actual + simulationDefaults.urbanization * 0.4) * (1 + weatherFactor) * (1 / drainageFactor)));
      return {
        time: bucketEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        actual,
        predicted,
      };
    });
  }, [reports, simulationDefaults, weather]);

  const modelAccuracy = useMemo(() => {
    if (predictionData.length === 0) return 100;
    const errors = predictionData.map((point) => {
      if (point.actual === 0) return 0;
      return Math.min(100, Math.abs(point.predicted - point.actual) / point.actual * 100);
    });
    const avgError = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    return Math.max(0, Math.round((100 - avgError) * 10) / 10);
  }, [predictionData]);

  const confidenceScore = useMemo(() => {
    if (reports.length === 0) return 80;
    const avgTrust = reports.reduce((sum, report) => sum + report.trust_score, 0) / reports.length;
    return Math.max(50, Math.min(99, Math.round(avgTrust)));
  }, [reports]);

  const dataDrift = useMemo(() => {
    if (predictionData.length === 0) return 0;
    const drift = predictionData.reduce((sum, point) => sum + Math.abs(point.predicted - point.actual), 0) / predictionData.length;
    return Math.min(100, Math.round(drift));
  }, [predictionData]);

  const latencyMs = Math.max(15, Math.round(20 + (weather?.windSpeed ?? 10) + reports.length * 0.6));

  const driftReport = reports.find((report) => report.severity_level === 'CRITICAL') || reports[0];

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
            <span className="text-green-500">{modelAccuracy}% ACCURACY</span>
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
                  <span className="text-green-500">{confidenceScore}%</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-green-500 h-full transition-all" style={{
                  width: `${confidenceScore}%`
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-gray-300">Data Drift</span>
                  <span className="text-yellow-400">{dataDrift}%</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-yellow-400 h-full transition-all" style={{
                  width: `${dataDrift}%`
                }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold">
                  <span className="text-gray-300">Latency</span>
                  <span className="text-blue-400">{latencyMs}ms</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-lg overflow-hidden">
                  <div className="bg-blue-400 h-full transition-all" style={{
                  width: `${Math.min(100, Math.round(latencyMs / 3))}%`
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
                  {driftReport
                    ? `Significant deviation detected near ${driftReport.location_name}. Recommendation: retrain with latest field and weather telemetry.`
                    : 'Significant deviation detected in recent rainfall patterns. Recommendation: retrain with latest sensor data.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}