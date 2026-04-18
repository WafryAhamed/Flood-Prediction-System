import React, { useMemo, useState } from 'react';
import { Radio, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useReportStore } from '../../stores/reportStore';
import { useAdminControlStore } from '../../stores/adminControlStore';
import { useWeatherData } from '../../hooks/useWeatherData';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#3B82F6',
  LOW: '#16A34A',
};

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function districtFromLocation(location: string): string {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || location;
}

export function SituationRoom() {
  const [crisisMode, setCrisisMode] = useState(false);
  const reports = useReportStore((s) => s.reports);
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);
  const { weather } = useWeatherData();

  const highestSeverity = useMemo(() => {
    if (reports.length === 0) return 'LOW';
    return reports.reduce((top, report) => (SEVERITY_ORDER[report.severity_level] > SEVERITY_ORDER[top] ? report.severity_level : top), reports[0].severity_level);
  }, [reports]);

  const activeIncidents = reports.filter((report) => report.status !== 'resolved').length;
  const populationAtRisk = activeIncidents * 890;
  const responseUnits = activeIncidents === 0
    ? 100
    : Math.min(100, Math.round((reports.filter((report) => report.status === 'response_dispatched' || report.status === 'resolved').length / activeIncidents) * 100));

  const districtStatus = useMemo(() => {
    const grouped = new Map<string, string>();
    reports.forEach((report) => {
      const district = districtFromLocation(report.location_name);
      const existing = grouped.get(district);
      if (!existing || SEVERITY_ORDER[report.severity_level] > SEVERITY_ORDER[existing]) {
        grouped.set(district, report.severity_level);
      }
    });

    return Array.from(grouped.entries()).slice(0, 6).map(([name, severity]) => {
      const status = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'WARNING' : severity === 'MEDIUM' ? 'WATCH' : 'NORMAL';
      const style = status === 'CRITICAL'
        ? { color: 'text-red-500', bg: 'bg-red-600/10 border-red-700' }
        : status === 'WARNING'
          ? { color: 'text-orange-500', bg: 'bg-orange-600/10 border-orange-700' }
          : status === 'WATCH'
            ? { color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-700' }
            : { color: 'text-green-500', bg: 'bg-green-600/10 border-green-700' };

      return { name, status, ...style };
    });
  }, [reports]);

  const liveFeed = useMemo(
    () => broadcastFeed.filter((item) => item.active).slice(0, 3),
    [broadcastFeed],
  );

  const latestReportTs = reports[0]?.timestamp;
  const feedTimestamp = latestReportTs
    ? `${Math.max(1, Math.round((Date.now() - latestReportTs) / 1000))}S AGO`
    : 'NO INCIDENTS';

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            National Situation Room
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            LIVE FEED • UPDATED {feedTimestamp}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCrisisMode(!crisisMode)} className={`px-6 py-3 border-2 font-bold uppercase text-sm tracking-wider transition-all rounded-lg ${crisisMode ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'border-red-600 text-red-600 hover:bg-red-600/10'}`}>
            {crisisMode ? '🚨 CRISIS MODE ACTIVE' : 'ACTIVATE CRISIS MODE'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-red-600">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">National Risk Level</div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <div className="text-4xl font-bold text-red-500">{highestSeverity === 'MEDIUM' ? 'MODERATE' : highestSeverity}</div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-orange-500">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Active Incidents</div>
          <div className="text-4xl font-bold text-white mb-1">{activeIncidents}</div>
          <div className="text-sm text-gray-400">Live from verified feed</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-blue-400">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Population at Risk</div>
          <div className="text-4xl font-bold text-blue-400">{populationAtRisk.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Stable</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 border-l-4 border-l-green-600">
          <div className="text-gray-400 text-sm uppercase font-semibold mb-2">Response Units</div>
          <div className="text-4xl font-bold text-green-500">{responseUnits}%</div>
          <div className="text-sm text-gray-400">Deployed</div>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map Section (2 cols) */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl relative flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
              <MapIcon size={18} /> Geospatial Intel
            </h3>
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-gray-400">
                LAYERS: RADAR, RISK, UNITS
              </span>
            </div>
          </div>
          <div className="flex-1 relative">
            <MapContainer center={[7.8731, 80.7718]} zoom={7} className="h-full w-full bg-gray-900">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} maxZoom={22} />
              {reports.slice(0, 20).map((report) => <CircleMarker key={report.report_id} center={[report.latitude, report.longitude]} radius={report.severity_level === 'CRITICAL' ? 8 : report.severity_level === 'HIGH' ? 7 : 6} pathOptions={{
                color: SEVERITY_COLOR[report.severity_level] || '#3B82F6',
                fillColor: SEVERITY_COLOR[report.severity_level] || '#3B82F6',
                fillOpacity: 0.6
              }}>
                  <Popup>{report.location_name}: {report.severity_level} Risk</Popup>
                </CircleMarker>)}
            </MapContainer>

            {/* Map Overlay Stats */}
            <div className="absolute bottom-6 left-6 bg-gray-900/95 border border-gray-700 p-4 rounded-lg z-[1000]">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                PRECIPITATION
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">{weather?.rainfall ?? 0}mm</div>
              <div className="text-xs text-gray-300">Heavy Rain Warning</div>
            </div>
          </div>
        </div>

        {/* Side Panel (1 col) */}
        <div className="flex flex-col gap-4">
          {/* District Status */}
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-sm font-bold uppercase text-yellow-400 flex items-center gap-2">
                <ShieldAlert size={18} /> District Status
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {districtStatus.map((d, i) => <div key={i} className={`flex justify-between items-center p-3 border rounded-lg ${d.bg}`}>
                  <span className="font-bold text-sm text-white">{d.name}</span>
                  <span className={`text-xs font-bold ${d.color}`}>
                    {d.status}
                  </span>
                </div>)}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="h-1/3 bg-gray-800 border border-gray-700 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
                <Radio size={18} /> Broadcast Feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                {liveFeed.map((item) => {
                  const border = item.type === 'critical' ? 'border-l-red-600' : item.type === 'warning' ? 'border-l-orange-500' : 'border-l-blue-500';
                  const text = item.type === 'critical' ? 'text-red-400' : item.type === 'warning' ? 'text-orange-400' : 'text-blue-400';
                  return <div key={item.id} className={`text-xs border-l-4 ${border} pl-3`}>
                      <div className={`font-semibold ${text} mb-1`}>
                        {item.time} • LIVE BROADCAST
                      </div>
                      <div className="text-gray-300">
                        {item.text}
                      </div>
                    </div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}