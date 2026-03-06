import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, X, MapPin, MessageSquare, AlertTriangle, Filter, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useReportStore, FloodReport } from '../../stores/reportStore';

// Fix default Leaflet marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function formatTimeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function computeAI(report: FloodReport, allPending: FloodReport[]) {
  const nearbyCount = allPending.filter((r) => {
    if (r.report_id === report.report_id) return false;
    const dLat = r.latitude - report.latitude;
    const dLng = r.longitude - report.longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111000; // rough meters
    return dist < 500;
  }).length;

  const veracity = Math.min(99, report.trust_score + (nearbyCount > 0 ? 5 : 0));
  const locationMatch = veracity > 85 ? 'Consistent with Satellite' : 'Partial Match';

  return { veracity, nearbyCount, locationMatch };
}

type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const MemoizedQueueItem = React.memo(function QueueItem({
  report,
  isSelected,
  onClick,
}: {
  report: FloodReport;
  isSelected: boolean;
  onClick: () => void;
}) {
  const severityColors: Record<string, string> = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-gray-700 text-gray-300',
    LOW: 'bg-gray-700 text-gray-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 border rounded-lg ${
        report.severity_level === 'CRITICAL'
          ? 'bg-red-600/10 border-red-600'
          : isSelected
          ? 'bg-blue-600/10 border-blue-400'
          : 'bg-gray-900 border-gray-700 hover:border-blue-400'
      } cursor-pointer transition-colors`}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
            severityColors[report.severity_level] || 'bg-gray-700 text-gray-300'
          }`}
        >
          {report.severity_level}
        </span>
        <span className="text-xs font-semibold text-gray-400">
          {formatTimeAgo(report.timestamp)}
        </span>
      </div>
      <p className="text-xs font-bold text-gray-200 mb-1 line-clamp-2">
        {report.description}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <MapPin size={10} /> {report.location_name}
      </div>
    </div>
  );
});

export function ReportModeration() {
  const pendingReports = useReportStore((s) => s.getPendingReports());
  const verifyReport = useReportStore((s) => s.verifyReport);
  const rejectReport = useReportStore((s) => s.rejectReport);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [, setTick] = useState(0);

  // Polling: force re-render every 5 seconds to pick up new reports & refresh time-ago
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = useMemo(() => {
    if (severityFilter === 'ALL') return pendingReports;
    return pendingReports.filter((r) => r.severity_level === severityFilter);
  }, [pendingReports, severityFilter]);

  const criticalCount = useMemo(
    () => pendingReports.filter((r) => r.severity_level === 'CRITICAL').length,
    [pendingReports]
  );

  const selectedReport = useMemo(
    () => filteredReports.find((r) => r.report_id === selectedId) ?? filteredReports[0] ?? null,
    [filteredReports, selectedId]
  );

  // Auto-select first report if selection is removed
  useEffect(() => {
    if (!selectedReport && filteredReports.length > 0) {
      setSelectedId(filteredReports[0].report_id);
    }
  }, [selectedReport, filteredReports]);

  const ai = useMemo(
    () => (selectedReport ? computeAI(selectedReport, pendingReports) : null),
    [selectedReport, pendingReports]
  );

  const handleVerify = useCallback(() => {
    if (!selectedReport) return;
    const id = selectedReport.report_id;
    verifyReport(id);
    setSelectedId(null);
  }, [selectedReport, verifyReport]);

  const handleReject = useCallback(() => {
    if (!selectedReport) return;
    const id = selectedReport.report_id;
    rejectReport(id);
    setSelectedId(null);
  }, [selectedReport, rejectReport]);

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Community Intelligence Hub
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            INCOMING STREAM • {pendingReports.length} NEW REPORTS
          </p>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 text-sm font-bold uppercase hover:bg-gray-600 flex items-center gap-2 rounded-lg transition-colors"
          >
            <Filter size={18} /> Filter{severityFilter !== 'ALL' ? `: ${severityFilter}` : ''}
          </button>
          {showFilterMenu && (
            <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityFilter[]).map((level) => (
                <button
                  key={level}
                  onClick={() => { setSeverityFilter(level); setShowFilterMenu(false); }}
                  className={`block w-full text-left px-5 py-2.5 text-xs font-bold uppercase transition-colors ${
                    severityFilter === level
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {level === 'ALL' ? 'All Severities' : level}
                </button>
              ))}
            </div>
          )}
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
              {criticalCount} CRITICAL
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredReports.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare size={32} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold uppercase">No pending reports</p>
              </div>
            )}
            {filteredReports.map((report) => (
              <MemoizedQueueItem
                key={report.report_id}
                report={report}
                isSelected={selectedReport?.report_id === report.report_id}
                onClick={() => setSelectedId(report.report_id)}
              />
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl flex flex-col">
          {!selectedReport ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <AlertTriangle size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-semibold uppercase">Select a report to view details</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
                    U
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">User {selectedReport.user_id}</div>
                    <div className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      TRUST SCORE: {selectedReport.trust_score}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleVerify}
                    className="px-4 py-2 bg-green-600 text-white font-bold uppercase text-xs hover:bg-green-700 flex items-center gap-2 rounded-lg transition-colors"
                  >
                    <Check size={16} /> Verify
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700 flex items-center gap-2 rounded-lg transition-colors"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black h-48 border border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-xs uppercase overflow-hidden">
                    {selectedReport.media_url ? (
                      <img
                        src={selectedReport.media_url}
                        alt="Report media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      'No media provided'
                    )}
                  </div>
                  <div className="h-48 border border-gray-700 rounded-lg overflow-hidden">
                    <MapContainer
                      key={selectedReport.report_id}
                      center={[selectedReport.latitude, selectedReport.longitude]}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedReport.latitude, selectedReport.longitude]}>
                        <Popup>
                          <strong>{selectedReport.location_name}</strong>
                          <br />
                          {selectedReport.severity_level}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900 p-4 border border-gray-700 rounded-lg">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">
                      Report Content
                    </h4>
                    <p className="text-sm text-gray-200">
                      "{selectedReport.description}"
                    </p>
                  </div>

                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                    <h4 className="text-xs font-bold uppercase text-blue-400 mb-3 flex items-center gap-2">
                      <Activity size={16} /> AI Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">Veracity Score</span>
                        <span className="text-white font-semibold">{ai?.veracity}% ({ai && ai.veracity >= 90 ? 'High' : ai && ai.veracity >= 75 ? 'Medium' : 'Low'} Confidence)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">Location Match</span>
                        <span className="text-white font-semibold">{ai?.locationMatch}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">Nearby Reports</span>
                        <span className="text-white font-semibold">{ai?.nearbyCount} similar in 500m radius</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>;
}