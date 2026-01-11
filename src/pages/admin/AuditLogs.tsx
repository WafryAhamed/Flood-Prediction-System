import React from 'react';
import { Shield, FileText, Lock, Search, Download, UserCheck } from 'lucide-react';
export function AuditLogs() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Security & Governance
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            AUDIT TRAIL: ACTIVE • ENCRYPTION: AES-256
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#132F4C] border border-[#1E4976] text-[#00E5FF] font-bold uppercase text-xs hover:bg-[#1E4976] flex items-center gap-2">
            <Download size={14} /> Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Status */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#132F4C] border border-[#1E4976] p-6">
            <h3 className="text-xs font-bold uppercase text-[#00E5FF] mb-6 flex items-center gap-2">
              <Shield size={14} /> System Security
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-[#0A1929] border border-[#1E4976]">
                <span className="text-xs font-bold text-gray-300">
                  2FA Enforcement
                </span>
                <span className="text-[10px] font-bold uppercase text-[#00E676] bg-[#00E676]/10 px-2 py-1">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0A1929] border border-[#1E4976]">
                <span className="text-xs font-bold text-gray-300">
                  Role-Based Access
                </span>
                <span className="text-[10px] font-bold uppercase text-[#00E676] bg-[#00E676]/10 px-2 py-1">
                  Strict
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0A1929] border border-[#1E4976]">
                <span className="text-xs font-bold text-gray-300">
                  Last Pen-Test
                </span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  14 Days Ago
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#132F4C] border border-[#1E4976] p-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <UserCheck size={14} /> Active Sessions
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
            }].map((s, i) => <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#0A1929]">
                  <div className="w-2 h-2 rounded-full bg-[#00E676]"></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{s.user}</div>
                    <div className="text-[10px] text-gray-500 font-mono-cmd">
                      {s.role} • {s.ip}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-[#132F4C] border border-[#1E4976] flex flex-col h-[600px]">
          <div className="p-4 border-b border-[#1E4976] flex justify-between items-center bg-[#0A1929]">
            <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
              <FileText size={14} /> Incident & Action Logs
            </h3>
            <div className="relative">
              <input type="text" placeholder="Search logs..." className="bg-[#132F4C] border border-[#1E4976] text-white pl-8 pr-4 py-1 text-xs focus:border-[#00E5FF] outline-none w-64" />
              <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#050B14] text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3 border-b border-[#1E4976]">Timestamp</th>
                  <th className="p-3 border-b border-[#1E4976]">User</th>
                  <th className="p-3 border-b border-[#1E4976]">Action</th>
                  <th className="p-3 border-b border-[#1E4976]">Resource</th>
                  <th className="p-3 border-b border-[#1E4976]">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono-cmd text-gray-300">
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
              }].map((log, i) => <tr key={i} className="hover:bg-[#0A1929] border-b border-[#1E4976]/50">
                    <td className="p-3 text-gray-500">{log.time}</td>
                    <td className="p-3 font-bold text-white">{log.user}</td>
                    <td className="p-3 text-[#00E5FF]">{log.action}</td>
                    <td className="p-3">{log.res}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${log.status === 'Success' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#FF1744]/10 text-[#FF1744]'}`}>
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