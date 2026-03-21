import React, { useState, useMemo } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { useReportStore } from '../../../stores/reportStore';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/20 text-orange-400',
  verified: 'bg-blue-500/20 text-blue-400',
  response_dispatched: 'bg-purple-500/20 text-purple-400',
  resolved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  LOW: 'bg-green-500/20 text-green-400',
};

export default function ReportsTab() {
  const reports = useReportStore((s) => s.reports);
  const updateReportStatus = useReportStore((s) => s.updateReportStatus);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'resolved'>(
    'all',
  );
  const [severityFilter, setSeverityFilter] = useState<'all' | string>('all');

  const filteredReports = useMemo(() => {
    let result = reports;
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (severityFilter !== 'all') result = result.filter((r) => r.severity_level === severityFilter);
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [reports, statusFilter, severityFilter]);

  const stats = useMemo(
    () => ({
      pending: reports.filter((r) => r.status === 'pending').length,
      verified: reports.filter((r) => r.status === 'verified').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    }),
    [reports],
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Pending Review</div>
          <div className="text-2xl font-black text-orange-400">{stats.pending}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Verified</div>
          <div className="text-2xl font-black text-blue-400">{stats.verified}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Resolved</div>
          <div className="text-2xl font-black text-green-400">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:border-blue-400 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:border-blue-400 outline-none"
        >
          <option value="all">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
            <MessageSquare size={18} /> Reports ({filteredReports.length})
          </h3>
        </div>
        <div className="p-6">
          <AdminDataTable
            columns={[
              { key: 'location', label: 'Location', width: '18%' },
              { key: 'severity', label: 'Severity', width: '12%' },
              { key: 'status', label: 'Status', width: '15%' },
              { key: 'trust', label: 'Trust', width: '10%' },
              { key: 'time', label: 'Reported', width: '15%' },
              { key: 'description', label: 'Description', width: '20%' },
              { key: 'actions', label: 'Actions', width: '10%' },
            ]}
            rows={filteredReports.map((report) => ({
              location: report.location_name,
              severity: (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${SEVERITY_COLORS[report.severity_level]}`}
                >
                  {report.severity_level}
                </span>
              ),
              status: (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLORS[report.status] || 'bg-gray-500/20'}`}
                >
                  {report.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              ),
              trust: `${Math.round(report.trust_score)}%`,
              time: new Date(report.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              description: (report.description || '').substring(0, 45) + '...',
              actions: (
                <div className="flex gap-1">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReportStatus(report.report_id, 'verified')}
                        className="p-1 hover:bg-green-500/20 rounded transition-colors"
                        title="Verify"
                      >
                        <Check size={14} className="text-green-400" />
                      </button>
                      <button
                        onClick={() => updateReportStatus(report.report_id, 'rejected')}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Reject"
                      >
                        <X size={14} className="text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              ),
            }))}
            emptyMessage="No reports found"
          />
        </div>
      </div>
    </div>
  );
}
