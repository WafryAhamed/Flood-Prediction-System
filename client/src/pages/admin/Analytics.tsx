import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Download, Filter, Database } from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import { useReportStore } from '../../stores/reportStore';
import { useAdminControlStore } from '../../stores/adminControlStore';

const SEVERITY_SCORE: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function Analytics() {
  const historyData = useMaintenanceStore((s) => s.historyData);
  const reports = useReportStore((s) => s.reports);
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);

  const trendData = useMemo(
    () => [...historyData]
      .sort((a, b) => a.year - b.year)
      .map((entry) => ({
        year: String(entry.year),
        events: entry.floods,
        damage: entry.rainfall,
      })),
    [historyData],
  );

  const rainfallByYear = useMemo(
    () => new Map(historyData.map((entry) => [entry.year, entry.rainfall])),
    [historyData],
  );

  const scatterData = useMemo(
    () => reports.slice(0, 20).map((report) => {
      const year = new Date(report.timestamp).getFullYear();
      const rainfall = rainfallByYear.get(year) ?? 0;
      return {
        x: Math.round(rainfall / 20),
        y: (SEVERITY_SCORE[report.severity_level] || 1) * 100,
        z: Math.max(80, report.trust_score * 4),
      };
    }),
    [reports, rainfallByYear],
  );

  const latestReport = reports[0];
  const datasetRows = useMemo(() => [
    {
      name: `flood_history_${new Date().getFullYear()}.json`,
      type: 'JSON',
      size: `${historyData.length} rows`,
      date: historyData.length > 0 ? `${Math.max(...historyData.map((item) => item.year))}` : 'N/A',
    },
    {
      name: 'citizen_reports_live.json',
      type: 'JSON',
      size: `${reports.length} rows`,
      date: latestReport ? new Date(latestReport.timestamp).toLocaleString() : 'N/A',
    },
    {
      name: 'active_broadcast_feed.json',
      type: 'JSON',
      size: `${broadcastFeed.filter((item) => item.active).length} rows`,
      date: broadcastFeed.find((item) => item.active)?.time || 'N/A',
    },
  ], [historyData, reports, latestReport, broadcastFeed]);

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Research & Policy Lab
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            DATA EXPLORER • CLIMATE MODELING
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-bold uppercase text-sm hover:bg-gray-700 flex items-center gap-2 rounded transition-colors">
            <Database size={18} /> Connect Data Source
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
            Long-term Flood Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#D1D5DB'
            }} cursor={{
              fill: '#374151',
              opacity: 0.2
            }} />
              <Bar dataKey="events" fill="#2563EB" />
              <Bar dataKey="damage" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
            Infrastructure vs Risk Correlation
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="x" name="Rainfall" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis type="number" dataKey="y" name="Damage" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} />
              <Tooltip cursor={{
              strokeDasharray: '3 3'
            }} contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#D1D5DB'
            }} />
              <Scatter name="Districts" data={scatterData} fill="#F97316" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase text-blue-400">
            Data Export Portal
          </h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Filter datasets..." className="bg-gray-900 border border-gray-700 text-white px-4 py-2 text-sm focus:border-blue-400 outline-none rounded" />
            <button className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="p-4 border-b border-gray-700">Dataset Name</th>
              <th className="p-4 border-b border-gray-700">Type</th>
              <th className="p-4 border-b border-gray-700">Size</th>
              <th className="p-4 border-b border-gray-700">Last Updated</th>
              <th className="p-4 border-b border-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-semibold text-gray-300">
            {datasetRows.map((file, i) => <tr key={i} className="hover:bg-gray-900 border-b border-gray-700/50">
                <td className="p-4 font-bold text-white">{file.name}</td>
                <td className="p-4">{file.type}</td>
                <td className="p-4">{file.size}</td>
                <td className="p-4 text-gray-500">{file.date}</td>
                <td className="p-4">
                  <button className="text-blue-400 hover:text-white flex items-center gap-1 transition-colors">
                    <Download size={16} /> Download
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}