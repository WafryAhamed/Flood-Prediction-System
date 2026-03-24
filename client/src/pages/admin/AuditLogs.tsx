import React, { useState, useEffect, useCallback } from 'react';
import { Shield, FileText, Lock, Search, Download, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string | null;
  ip_address: string | null;
  performed_at: string | null;
}

interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatAction(action: string): string {
  return action.toUpperCase().replace(/_/g, ' ');
}

function getActionColor(action: string): string {
  switch (action) {
    case 'create': return 'bg-green-500/10 text-green-500';
    case 'update': return 'bg-blue-500/10 text-blue-400';
    case 'delete': return 'bg-red-600/10 text-red-500';
    case 'login': return 'bg-purple-500/10 text-purple-400';
    case 'logout': return 'bg-gray-500/10 text-gray-400';
    case 'broadcast': return 'bg-orange-500/10 text-orange-400';
    case 'approve': return 'bg-green-500/10 text-green-400';
    case 'reject': return 'bg-red-500/10 text-red-400';
    case 'export': return 'bg-cyan-500/10 text-cyan-400';
    default: return 'bg-gray-500/10 text-gray-400';
  }
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        page_size: '50',
      });
      const response = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }
      const data = (await response.json()) as AuditLogsResponse;
      setLogs(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs(page);
  }, [page, fetchLogs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchLogs(page);
    }, 30000);
    return () => clearInterval(interval);
  }, [page, fetchLogs]);

  const filteredLogs = searchQuery
    ? logs.filter(
        (log) =>
          log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / 50);

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Security & Governance
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            AUDIT TRAIL: ACTIVE • {total} TOTAL ENTRIES • ENCRYPTION: AES-256
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void fetchLogs(page)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 font-bold uppercase text-sm hover:bg-gray-700 flex items-center gap-2 rounded transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="px-6 py-3 bg-gray-800 border border-gray-700 text-blue-400 font-bold uppercase text-sm hover:bg-gray-700 flex items-center gap-2 rounded transition-colors">
            <Download size={18} /> Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Status */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-6 flex items-center gap-2">
              <Shield size={18} /> System Security
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-900 border border-gray-700 rounded">
                <span className="text-sm font-bold text-gray-300">
                  2FA Enforcement
                </span>
                <span className="text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900 border border-gray-700 rounded">
                <span className="text-sm font-bold text-gray-300">
                  Role-Based Access
                </span>
                <span className="text-[10px] font-bold uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  Strict
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900 border border-gray-700 rounded">
                <span className="text-sm font-bold text-gray-300">
                  Audit Entries
                </span>
                <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                  {total} logged
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <UserCheck size={18} /> Quick Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Creates', count: logs.filter((l) => l.action === 'create').length, color: 'text-green-400' },
                { label: 'Updates', count: logs.filter((l) => l.action === 'update').length, color: 'text-blue-400' },
                { label: 'Deletes', count: logs.filter((l) => l.action === 'delete').length, color: 'text-red-400' },
                { label: 'Logins', count: logs.filter((l) => l.action === 'login').length, color: 'text-purple-400' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center p-2 hover:bg-gray-900 rounded">
                  <span className="text-sm text-gray-300">{stat.label}</span>
                  <span className={`text-sm font-bold ${stat.color}`}>{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 flex flex-col h-[600px] rounded-lg">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <h3 className="text-sm font-bold uppercase text-gray-400 flex items-center gap-2">
              <FileText size={18} /> Incident & Action Logs
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white pl-8 pr-4 py-2 text-sm focus:border-blue-400 outline-none w-64 rounded"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <RefreshCw size={24} className="animate-spin mr-2" />
                <span className="text-sm font-semibold uppercase">Loading audit logs…</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
                <AlertTriangle size={32} />
                <span className="text-sm font-semibold">{error}</span>
                <button
                  onClick={() => void fetchLogs(page)}
                  className="mt-2 px-4 py-2 bg-gray-700 text-white text-xs font-bold uppercase rounded hover:bg-gray-600"
                >
                  Retry
                </button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Lock size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-semibold uppercase">
                  {searchQuery ? 'No matching logs' : 'No audit logs recorded yet'}
                </span>
                <span className="text-xs text-gray-600 mt-1">
                  Admin actions will appear here automatically
                </span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="p-4 border-b border-gray-700">Timestamp</th>
                    <th className="p-4 border-b border-gray-700">User</th>
                    <th className="p-4 border-b border-gray-700">Action</th>
                    <th className="p-4 border-b border-gray-700">Resource</th>
                    <th className="p-4 border-b border-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-gray-300">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-900 border-b border-gray-700/50">
                      <td className="p-4 text-gray-500 text-xs font-mono whitespace-nowrap">
                        {log.performed_at
                          ? new Date(log.performed_at).toLocaleString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              month: 'short',
                              day: 'numeric',
                              hour12: false,
                            })
                          : '—'}
                      </td>
                      <td className="p-4 font-bold text-white">{log.user_email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 uppercase text-xs">
                        {log.resource_type}
                        {log.resource_id && (
                          <span className="text-gray-600 ml-1">#{log.resource_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs max-w-[200px] truncate">
                        {log.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-900">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages} ({total} entries)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded disabled:opacity-30 hover:bg-gray-600 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded disabled:opacity-30 hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>;
}