import React, { useState, useMemo } from 'react';
import { Users, Search, Shield, Ban, Trash2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import { useReportStore } from '../../stores/reportStore';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted';

export function UserManagement() {
  const users = useMaintenanceStore((s) => s.users);
  const suspendUser = useMaintenanceStore((s) => s.suspendUser);
  const activateUser = useMaintenanceStore((s) => s.activateUser);
  const deleteUser = useMaintenanceStore((s) => s.deleteUser);
  const allReports = useReportStore((s) => s.reports);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string } | null>(null);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (statusFilter !== 'all') result = result.filter((u) => u.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.userId.includes(q) || u.district.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, statusFilter, search]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    deleted: users.filter((u) => u.status === 'deleted').length,
  }), [users]);

  const getUserReports = (userId: string) => allReports.filter((r) => r.user_id === userId);

  const handleAction = (userId: string, action: string) => {
    if (confirmAction?.userId === userId && confirmAction?.action === action) {
      if (action === 'suspend') suspendUser(userId);
      else if (action === 'activate') activateUser(userId);
      else if (action === 'delete') deleteUser(userId);
      setConfirmAction(null);
    } else {
      setConfirmAction({ userId, action });
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-600 text-white',
    suspended: 'bg-yellow-500 text-gray-900',
    deleted: 'bg-red-600 text-white',
  };

  const trustColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} className="text-blue-400" />
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white">
            User Management
          </h2>
        </div>
        <p className="text-sm font-semibold text-gray-400">
          USER CONTROL • {stats.total} REGISTERED USERS
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Suspended', value: stats.suspended, color: 'text-yellow-400' },
          { label: 'Deleted', value: stats.deleted, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-xs font-bold uppercase text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, ID, or district..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'suspended', 'deleted'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                statusFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm font-semibold uppercase">
            No users match the current filters
          </div>
        )}
        {filteredUsers.map((user) => {
          const isExpanded = expandedUser === user.id;
          const reports = getUserReports(user.userId);
          return (
            <div key={user.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              {/* User Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setExpandedUser(isExpanded ? null : user.id)}
              >
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs text-white">{user.name.split(' ').map((n) => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{user.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{user.userId}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${statusColors[user.status]}`}>
                      {user.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{user.district} • Last active {formatTimeAgo(user.lastActive)}</span>
                </div>
                <div className="text-center px-3">
                  <p className={`text-lg font-bold ${trustColor(user.trustScore)}`}>{user.trustScore}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-500">Trust</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-lg font-bold text-white">{user.reportCount}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-500">Reports</p>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Info */}
                    <div>
                      <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">User Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Joined</span><span className="text-white">{formatDate(user.joinedAt)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">District</span><span className="text-white">{user.district}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Trust Score</span><span className={trustColor(user.trustScore)}>{user.trustScore}/100</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Total Reports</span><span className="text-white">{user.reportCount}</span></div>
                      </div>
                    </div>

                    {/* Report History */}
                    <div>
                      <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Recent Reports</h4>
                      {reports.length === 0 ? (
                        <p className="text-xs text-gray-500">No reports in current session</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {reports.slice(0, 5).map((r) => (
                            <div key={r.report_id} className="flex items-center gap-2 text-xs bg-gray-900 p-2 rounded-lg">
                              <span className={`font-bold uppercase px-1.5 py-0.5 rounded ${
                                r.severity_level === 'CRITICAL' ? 'bg-red-600 text-white' :
                                r.severity_level === 'HIGH' ? 'bg-orange-500 text-white' :
                                'bg-gray-700 text-gray-300'
                              }`}>{r.severity_level}</span>
                              <span className="text-gray-300 flex-1 truncate">{r.description}</span>
                              <span className={`font-semibold ${r.status === 'verified' ? 'text-green-400' : r.status === 'rejected' ? 'text-red-400' : 'text-gray-400'}`}>{r.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-3">
                    {user.status !== 'active' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(user.id, 'activate'); }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                          confirmAction?.userId === user.id && confirmAction?.action === 'activate'
                            ? 'bg-green-600 text-white animate-pulse'
                            : 'bg-gray-700 text-green-400 hover:bg-gray-600'
                        }`}
                      >
                        <CheckCircle size={14} />
                        {confirmAction?.userId === user.id && confirmAction?.action === 'activate' ? 'Confirm Activate' : 'Activate'}
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(user.id, 'suspend'); }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                          confirmAction?.userId === user.id && confirmAction?.action === 'suspend'
                            ? 'bg-yellow-500 text-gray-900 animate-pulse'
                            : 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                        }`}
                      >
                        <Ban size={14} />
                        {confirmAction?.userId === user.id && confirmAction?.action === 'suspend' ? 'Confirm Suspend' : 'Suspend'}
                      </button>
                    )}
                    {user.status !== 'deleted' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(user.id, 'delete'); }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                          confirmAction?.userId === user.id && confirmAction?.action === 'delete'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-gray-700 text-red-400 hover:bg-gray-600'
                        }`}
                      >
                        <Trash2 size={14} />
                        {confirmAction?.userId === user.id && confirmAction?.action === 'delete' ? 'Confirm Delete' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
