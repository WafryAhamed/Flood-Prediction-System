import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, Send, AlertTriangle, Plus, X, CheckCircle, Clock, Truck, ShieldCheck } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useReportStore, FloodReport } from '../stores/reportStore';

const SEVERITY_MAP: Record<string, FloodReport['severity_level']> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  Critical: 'CRITICAL',
};

// Sample locations for submitted reports
const LOCATIONS = [
  { name: 'Kelaniya, Gampaha', lat: 6.9533, lng: 79.9220 },
  { name: 'Kaduwela, Colombo', lat: 6.9310, lng: 79.9830 },
  { name: 'Colombo 07', lat: 6.9271, lng: 79.8612 },
  { name: 'Biyagama, Gampaha', lat: 6.9692, lng: 79.9820 },
  { name: 'Hanwella, Colombo', lat: 6.9010, lng: 80.0852 },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending verification', bg: 'bg-orange-500/10', text: 'text-orange-500' },
  verified: { label: 'Verified', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  action_in_progress: { label: 'Help dispatched', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  response_dispatched: { label: 'Help dispatched', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  resolved: { label: 'Resolved', bg: 'bg-green-500/10', text: 'text-green-600' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-500' },
};

function ReportStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`text-xs font-bold px-md py-xs rounded-card ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

export function CommunityReports() {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitToast, setSubmitToast] = useState(false);
  const addReport = useReportStore((s) => s.addReport);
  const allReports = useReportStore((s) => s.reports);
  const [, setTick] = useState(0);

  // Polling: refresh every 15 seconds to pick up status changes
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  // Public sees only verified, response_dispatched, or resolved
  const visibleReports = allReports.filter((r) => r.status === 'verified' || r.status === 'response_dispatched' || r.status === 'resolved').slice(0, 20);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitReport = useCallback(() => {
    if (!reportType) return;
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    addReport({
      severity_level: SEVERITY_MAP[reportType] || 'MEDIUM',
      description: description.trim() || 'Water level rising rapidly. Road impassable.',
      location_name: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      media_url: null,
    });
    setReportType('');
    setDescription('');
    setSubmitToast(true);
    setTimeout(() => setSubmitToast(false), 5000);
  }, [reportType, description, addReport]);

  const formatTimeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="min-h-screen md:pt-lg px-4 sm:px-6 md:px-8 pb-xl bg-bg-primary md:mr-[384px] lg:mr-[400px]">
      {/* Header Section */}
      <section className="max-w-4xl mx-auto mb-xl">
        <div className="inline-block bg-orange-500 text-white px-lg py-sm font-bold text-xs uppercase mb-md rounded-card">
          Crowdsourced Intelligence
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary">
              Report Flooding
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-md px-lg py-md bg-critical text-white font-bold text-sm uppercase rounded-card hover:opacity-90 transition-opacity w-full md:w-auto"
          >
            <Plus size={20} /> New Report
          </button>
        </div>
      </section>

      {/* Submit Confirmation Toast */}
      <AnimatePresence>
        {submitToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto mb-lg"
          >
            <div className="bg-orange-50 border border-orange-200 rounded-card p-md flex items-center gap-md">
              <Clock size={20} className="text-orange-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-orange-700">Report Submitted</p>
                <p className="text-xs text-orange-600">Your report is under verification by authorities. You will see updates here.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Reports Grid */}
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bold text-lg uppercase mb-lg text-text-primary">Recent Reports</h2>

        {/* Loading state */}
        {isLoading && <LoadingSkeleton count={4} variant="card" height="h-48" />}

        {/* Empty state */}
        {!isLoading && visibleReports.length === 0 && (
          <EmptyState
            emoji="👍"
            title="No flooding reported in your area yet"
            description="When your neighbors report flooding, you'll see their reports here."
            actionLabel="Report Flooding"
            onAction={() => setShowForm(true)}
          />
        )}

        {/* Reports grid */}
        {!isLoading && visibleReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {visibleReports.map(r => (
            <UnifiedCard key={r.report_id} noPadding className="overflow-hidden">
              {/* Image */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-b border-border-light">
                {r.media_url ? (
                  <img src={r.media_url} alt="Report media" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="p-lg">
                <div className="flex items-start justify-between mb-md">
                  <div className="flex items-center gap-md flex-wrap">
                    <ReportStatusBadge status={r.status} />
                    <span className="text-xs font-semibold text-text-secondary">
                      {formatTimeAgo(r.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <div className={`w-3 h-3 rounded-full ${
                      r.severity_level === 'CRITICAL' ? 'bg-critical' :
                      r.severity_level === 'HIGH' ? 'bg-orange-500' :
                      r.severity_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className={`text-xs font-bold uppercase ${
                      r.severity_level === 'CRITICAL' ? 'text-critical' :
                      r.severity_level === 'HIGH' ? 'text-orange-500' :
                      r.severity_level === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                    }`}>{r.severity_level}</span>
                  </div>
                </div>

                <p className="font-semibold text-sm leading-snug mb-md text-text-primary">
                  {r.description}
                </p>

                <div className="flex items-center gap-md text-xs font-semibold text-text-secondary mb-lg">
                  <MapPin size={16} /> {r.location_name}
                </div>

                <div className="pt-lg border-t border-border-light">
                  {/* Emergency response status message */}
                  {r.emergency_response_status && r.status !== 'pending' && (
                    <div className={`flex items-center gap-md text-xs font-bold mb-md px-md py-sm rounded-card ${
                      r.status === 'response_dispatched' ? 'bg-purple-50 text-purple-700' :
                      r.status === 'resolved' ? 'bg-green-50 text-green-700' :
                      r.status === 'verified' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {r.status === 'response_dispatched' && <Truck size={14} />}
                      {r.status === 'resolved' && <CheckCircle size={14} />}
                      {r.status === 'verified' && <ShieldCheck size={14} />}
                      {r.emergency_response_status}
                    </div>
                  )}
                  <div className="flex justify-around">
                    <button className="flex flex-col items-center gap-xs text-text-secondary hover:text-critical transition-colors">
                      <AlertTriangle size={18} />
                      <span className="text-xs font-bold">Verify</span>
                    </button>
                    <button className="flex flex-col items-center gap-xs text-text-secondary hover:text-info transition-colors">
                      <MapPin size={18} />
                      <span className="text-xs font-bold">Map</span>
                    </button>
                    <button className="flex flex-col items-center gap-xs text-text-secondary hover:text-safe transition-colors">
                      <Send size={18} />
                      <span className="text-xs font-bold">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </UnifiedCard>
          ))}
        </div>
        )}
      </div>

      {/* Report Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full bg-card-bg h-full border-l border-gray-200 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-lg border-b border-gray-200 flex justify-between items-center sticky top-0 bg-card-bg">
                <h2 className="text-lg font-bold text-primary-text uppercase">New Report</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-secondary-text hover:text-primary-text transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-lg space-y-lg">
                {/* Severity Level */}
                <div>
                  <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
                    1. Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-md">
                    {['Low', 'Medium', 'Critical'].map(level => (
                      <button
                        key={level}
                        onClick={() => setReportType(level)}
                        className={`py-md font-bold uppercase text-xs rounded-soft transition-all border ${
                          reportType === level
                            ? 'bg-critical-red text-white border-critical-red'
                            : 'bg-primary-bg text-primary-text border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
                    2. Add Photo
                  </label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-primary-bg hover:bg-gray-50 transition-colors rounded-soft cursor-pointer">
                    <Camera size={32} className="text-gray-400 mb-md" />
                    <span className="font-semibold uppercase text-xs text-secondary-text">
                      Tap to take photo
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
                    3. Location
                  </label>
                  <div className="flex items-center gap-md p-md border border-gray-200 bg-primary-bg rounded-soft">
                    <MapPin size={18} className="text-primary-text shrink-0" />
                    <span className="font-mono font-semibold text-xs text-secondary-text flex-1">
                      6.9271° N, 79.8612° E
                    </span>
                    <span className="text-xs font-bold uppercase bg-safe-green text-white px-md py-xs rounded-soft shrink-0">
                      GPS
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
                    4. Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the flood situation..."
                    className="w-full p-md border border-gray-200 bg-primary-bg rounded-soft text-sm text-primary-text placeholder-gray-400 resize-none"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => { handleSubmitReport(); setShowForm(false); }}
                  disabled={!reportType}
                  className="w-full bg-critical-red text-white py-md font-bold uppercase text-sm rounded-soft hover:opacity-90 shadow-md transition-opacity flex items-center justify-center gap-md disabled:opacity-50"
                >
                  <Send strokeWidth={2.5} size={18} /> Report Flooding
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Form Panel */}
      <div className="hidden md:block fixed right-0 top-0 bottom-0 w-80 lg:w-96 bg-card-bg border-l border-gray-200 overflow-y-auto shadow-lg">
        <div className="p-lg border-b border-gray-200 sticky top-0 bg-card-bg">
          <h2 className="text-lg font-bold text-primary-text uppercase">New Report</h2>
        </div>

        <div className="p-lg space-y-lg">
          {/* Severity Level */}
          <div>
            <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
              1. Severity Level
            </label>
            <div className="grid grid-cols-3 gap-md">
              {['Low', 'Medium', 'Critical'].map(level => (
                <button
                  key={level}
                  onClick={() => setReportType(level)}
                  className={`py-md font-bold uppercase text-xs rounded-soft transition-all border ${
                    reportType === level
                      ? 'bg-critical-red text-white border-critical-red'
                      : 'bg-primary-bg text-primary-text border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
              2. Add Photo
            </label>
            <div className="w-full h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-primary-bg hover:bg-gray-50 transition-colors rounded-soft cursor-pointer">
              <Camera size={32} className="text-gray-400 mb-md" />
              <span className="font-semibold uppercase text-xs text-secondary-text">
                Tap to take photo
              </span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
              3. Location
            </label>
            <div className="flex items-center gap-md p-md border border-gray-200 bg-primary-bg rounded-soft">
              <MapPin size={18} className="text-primary-text shrink-0" />
              <span className="font-mono font-semibold text-xs text-secondary-text flex-1">
                6.9271° N, 79.8612° E
              </span>
              <span className="text-xs font-bold uppercase bg-safe-green text-white px-md py-xs rounded-soft shrink-0">
                GPS
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold uppercase text-xs mb-md tracking-tight text-primary-text">
              4. Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the flood situation..."
              className="w-full p-md border border-gray-200 bg-primary-bg rounded-soft text-sm text-primary-text placeholder-gray-400 resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitReport}
            disabled={!reportType}
            className="w-full bg-critical-red text-white py-md font-bold uppercase text-sm rounded-soft hover:opacity-90 shadow-md transition-opacity flex items-center justify-center gap-md disabled:opacity-50"
          >
            <Send strokeWidth={2.5} size={18} /> Report Flooding
          </button>
        </div>
      </div>
    </div>
  );
}