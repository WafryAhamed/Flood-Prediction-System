import React, { useMemo } from 'react';
import { Hammer, Truck, HeartHandshake, FileText, CheckCircle } from 'lucide-react';
import { useAdminControlStore } from '../../stores/adminControlStore';
import { useReportStore } from '../../stores/reportStore';

export function RecoveryCommand() {
  const recoveryProgress = useAdminControlStore((s) => s.recoveryProgress);
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);
  const reports = useReportStore((s) => s.reports);

  const progressByLabel = useMemo(() => {
    const get = (needle: string, fallback: number) => {
      const match = recoveryProgress.find((item) => item.label.toLowerCase().includes(needle.toLowerCase()));
      return match?.percent ?? fallback;
    };
    return {
      road: get('Road', 85),
      power: get('Power', 62),
      aid: get('Water', 45),
    };
  }, [recoveryProgress]);

  const pendingApprovals = useMemo(
    () => reports
      .filter((report) => report.status === 'pending' || report.status === 'verified')
      .slice(0, 3)
      .map((report) => ({
        item: `Response approval: ${report.location_name}`,
        status: report.status === 'pending' ? 'Pending' : 'Review',
        req: `${report.severity_level} • Trust ${report.trust_score}`,
      })),
    [reports],
  );

  const latestNotice = broadcastFeed.find((item) => item.active);
  const resolvedCount = reports.filter((report) => report.status === 'resolved').length;

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Post-Flood Recovery
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            PHASE 2: RESTORATION • RESOLVED CASES: {resolvedCount}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-green-500 text-black font-bold uppercase text-sm hover:bg-green-600 flex items-center gap-2 rounded transition-colors">
            <FileText size={18} /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-6">
              National Restoration Progress
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Truck size={16} /> Road Network
                  </span>
                  <span className="font-semibold text-green-500">{progressByLabel.road}%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{
                  width: `${progressByLabel.road}%`
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Hammer size={16} /> Power Grid
                  </span>
                  <span className="font-semibold text-yellow-400">{progressByLabel.power}%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full" style={{
                  width: `${progressByLabel.power}%`
                }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <HeartHandshake size={16} /> Aid Distribution
                  </span>
                  <span className="font-semibold text-blue-400">{progressByLabel.aid}%</span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full" style={{
                  width: `${progressByLabel.aid}%`
                }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 h-64 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Damage Assessment Map
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold bg-gray-950 border border-gray-700 rounded">
                [HEATMAP]
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 h-64 rounded-lg">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">
                Community Needs
              </h3>
              <div className="flex items-center justify-center h-full text-gray-600 text-xs font-semibold bg-gray-950 border border-gray-700 rounded">
                [CLUSTER MAP]
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Pending Approvals
            </h3>
            <div className="space-y-3">
              {pendingApprovals.map((task, i) => <div key={i} className="p-4 bg-gray-900 border border-gray-700 flex justify-between items-center rounded">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {task.item}
                    </div>
                    <div className="text-[10px] text-gray-400">{task.req}</div>
                  </div>
                  <button className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors">
                    <CheckCircle size={16} />
                  </button>
                </div>)}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Public Notices
            </h3>
            <div className="space-y-2">
              <button className="w-full py-3 bg-gray-900 border border-gray-700 text-sm font-bold text-gray-300 hover:text-white text-left px-3 rounded transition-colors">
                + Draft New Bulletin
              </button>
              <div className="p-2 bg-blue-400/10 border border-blue-400/30 text-[10px] text-blue-400 rounded">
                {latestNotice ? `Active: "${latestNotice.text}" (Sent ${latestNotice.time})` : 'No active public bulletins'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}