import React, { useMemo } from 'react';
import { Radio, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useReportStore } from '../../../stores/reportStore';
import { useAdminCentralStore } from '../../../stores/adminCentralStore';
import { useWeatherData } from '../../../hooks/useWeatherData';
import { LiveTile } from '../../../components/admin/LiveTile';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';

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

export default function SituationRoomTab() {
  const reports = useReportStore((s) => s.reports);
  const { weather } = useWeatherData();

  const highestSeverity = useMemo(() => {
    if (reports.length === 0) return 'LOW';
    return reports.reduce(
      (top, report) =>
        SEVERITY_ORDER[report.severity_level] > SEVERITY_ORDER[top]
          ? report.severity_level
          : top,
      reports[0].severity_level,
    );
  }, [reports]);

  const activeIncidents = reports.filter((r) => r.status !== 'resolved').length;
  const populationAtRisk = activeIncidents * 890;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const responseRate = Math.round((resolvedCount / Math.max(reports.length, 1)) * 100);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <LiveTile
          label="Highest Severity"
          value={highestSeverity}
          color={
            highestSeverity === 'CRITICAL'
              ? 'red'
              : highestSeverity === 'HIGH'
                ? 'amber'
                : 'green'
          }
          pulsing={highestSeverity === 'CRITICAL'}
        />
        <LiveTile
          label="Active Incidents"
          value={activeIncidents}
          trend={`${resolvedCount} resolved`}
          color="cyan"
        />
        <LiveTile
          label="Population at Risk"
          value={populationAtRisk.toLocaleString()}
          color="amber"
        />
        <LiveTile
          label="Response Rate"
          value={`${responseRate}%`}
          color="green"
          trendUp
        />
      </div>

      {/* Map Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h3 className="text-sm font-bold uppercase text-blue-400">Incident Map</h3>
        </div>
        <div className="h-96 bg-gray-900">
          <MapContainer center={[6.9271, 80.7789]} zoom={7} style={{ height: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {reports.map((report) => (
              <CircleMarker
                key={report.report_id}
                center={[report.latitude, report.longitude]}
                radius={8}
                fillColor={SEVERITY_COLOR[report.severity_level]}
                color={SEVERITY_COLOR[report.severity_level]}
                weight={2}
                opacity={1}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{report.location_name}</strong>
                    <br />
                    Severity: {report.severity_level}
                    <br />
                    Status: {report.status}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Active Incidents Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
            <Radio size={18} /> Active Incidents ({activeIncidents})
          </h3>
        </div>
        <div className="p-6">
          <AdminDataTable
            columns={[
              { key: 'location', label: 'Location', width: '25%' },
              { key: 'severity', label: 'Severity', width: '15%' },
              { key: 'status', label: 'Status', width: '15%' },
              { key: 'trust', label: 'Trust Score', width: '15%' },
              { key: 'time', label: 'Time', width: '15%' },
              { key: 'description', label: 'Details', width: '15%' },
            ]}
            rows={reports
              .filter((r) => r.status !== 'resolved')
              .slice(0, 10)
              .map((report) => ({
                location: report.location_name,
                severity: (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      report.severity_level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400'
                        : report.severity_level === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {report.severity_level}
                  </span>
                ),
                status: (
                  <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 capitalize">
                    {report.status}
                  </span>
                ),
                trust: `${Math.round(report.trust_score)}%`,
                time: new Date(report.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                description: report.description?.substring(0, 40) + '...',
              }))}
            emptyMessage="No active incidents"
          />
        </div>
      </div>
    </div>
  );
}
