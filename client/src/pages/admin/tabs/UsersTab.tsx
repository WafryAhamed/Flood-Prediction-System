import React, { useState, useMemo } from 'react';
import { Users, Search, Activity } from 'lucide-react';
import { useMaintenanceStore } from '../../../stores/maintenanceStore';
import { useReportStore } from '../../../stores/reportStore';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { AdminActionMenu } from '../../../components/admin/AdminActionMenu';

export default function UsersTab() {
  const users = useMaintenanceStore((s) => s.users);
  const allReports = useReportStore((s) => s.reports);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filteredUsers = useMemo(() => {
    let result = users;
    if (statusFilter !== 'all') result = result.filter((u) => u.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          u.userId.includes(q),
      );
    }
    return result;
  }, [users, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
    }),
    [users],
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Total Users</div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Active</div>
          <div className="text-2xl font-black text-green-400">{stats.active}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Suspended</div>
          <div className="text-2xl font-black text-red-400">{stats.suspended}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:border-blue-400 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:border-blue-400 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h3 className="text-sm font-bold uppercase text-blue-400 flex items-center gap-2">
            <Users size={18} /> User List ({filteredUsers.length})
          </h3>
        </div>
        <div className="p-6">
          <AdminDataTable
            columns={[
              { key: 'name', label: 'Name', width: '20%' },
              { key: 'email', label: 'Email', width: '25%' },
              { key: 'district', label: 'District', width: '15%' },
              { key: 'status', label: 'Status', width: '15%' },
              { key: 'reports', label: 'Reports', width: '10%' },
              { key: 'actions', label: 'Actions', width: '15%' },
            ]}
            rows={filteredUsers.map((user) => ({
              name: user.name,
              email: user.email || '-',
              district: user.district,
              status: (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    user.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : user.status === 'suspended'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {user.status.toUpperCase()}
                </span>
              ),
              reports: allReports.filter((r) => r.user_id === user.userId).length,
              actions: <AdminActionMenu userId={user.userId} />,
            }))}
            emptyMessage="No users found"
          />
        </div>
      </div>
    </div>
  );
}
