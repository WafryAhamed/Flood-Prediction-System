import React from 'react';
import { Shield, FileText, Lock, Search, Download, UserCheck } from 'lucide-react';
export function AuditLogs() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Security & Governance
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            AUDIT TRAIL: ACTIVE • ENCRYPTION: AES-256
          </p>
        </div>
        <div className="flex gap-2">
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
                  Last Pen-Test
                </span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  14 Days Ago
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <UserCheck size={18} /> Active Sessions
            </h3>
            <div className="space-y-3">
              {[{
              user: 'Cmd. Perera',
              role: 'Super Admin',
              ip: '192.168.1.42',
              loc: 'HQ'
            }, {
              user: 'Off. Silva',
              role: 'District Ops',
              ip: '10.0.0.12',
              loc: 'Gampaha'
            }, {
              user: 'Analyst Raj',
              role: 'Researcher',
              ip: '10.0.0.8',
              loc: 'Remote'
            }].map((s, i) => <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{s.user}</div>
                    <div className="text-[10px] text-gray-500 font-semibold">
                      {s.role} • {s.ip}
                    </div>
                  </div>
                </div>)}
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
              <input type="text" placeholder="Search logs..." className="bg-gray-800 border border-gray-700 text-white pl-8 pr-4 py-2 text-sm focus:border-blue-400 outline-none w-64 rounded" />
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-4 border-b border-gray-700">Timestamp</th>
                  <th className="p-4 border-b border-gray-700">User</th>
                  <th className="p-4 border-b border-gray-700">Action</th>
                  <th className="p-4 border-b border-gray-700">Resource</th>
                  <th className="p-4 border-b border-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-gray-300">
                {[{
                time: '14:02:45',
                user: 'Cmd. Perera',
                action: 'BROADCAST_ALERT',
                res: 'Sector 7',
                status: 'Success'
              }, {
                time: '13:55:12',
                user: 'System',
                action: 'AUTO_SCALE',
                res: 'Model Server',
                status: 'Success'
              }, {
                time: '13:42:01',
                user: 'Off. Silva',
                action: 'UPDATE_SHELTER',
                res: 'Temple Hall',
                status: 'Success'
              }, {
                time: '13:30:22',
                user: 'Unknown',
                action: 'LOGIN_ATTEMPT',
                res: 'Admin Portal',
                status: 'Failed'
              }, {
                time: '13:15:00',
                user: 'Analyst Raj',
                action: 'EXPORT_DATA',
                res: 'Rainfall_2023',
                status: 'Success'
              }, {
                time: '12:45:33',
                user: 'Cmd. Perera',
                action: 'CHANGE_RISK',
                res: 'Gampaha',
                status: 'Success'
              }].map((log, i) => <tr key={i} className="hover:bg-gray-900 border-b border-gray-700/50">
                    <td className="p-4 text-gray-500">{log.time}</td>
                    <td className="p-4 font-bold text-white">{log.user}</td>
                    <td className="p-4 text-blue-400">{log.action}</td>
                    <td className="p-4">{log.res}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${log.status === 'Success' ? 'bg-green-500/10 text-green-500' : 'bg-red-600/10 text-red-600'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>;
}