import React, { useEffect, useMemo, useState } from 'react';
import { Map, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useReportStore } from '../../stores/reportStore';
import { useAdminControlStore } from '../../stores/adminControlStore';
import { useMaintenanceStore } from '../../stores/maintenanceStore';

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 95,
  HIGH: 75,
  MEDIUM: 55,
  LOW: 35,
};

const RISK_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
  SAFE: 0,
};

function districtFromLocation(location: string): string {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || location;
}

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function DistrictControl() {
  const reports = useReportStore((s) => s.reports);
  const dashboardResources = useAdminControlStore((s) => s.dashboardResources);
  const mapZones = useMaintenanceStore((s) => s.mapZones);
  const evacuationRoutes = useMaintenanceStore((s) => s.evacuationRoutes);

  const districts = useMemo(() => {
    const list = Array.from(new Set(reports.map((report) => districtFromLocation(report.location_name))));
    return list.length > 0 ? list : ['Colombo'];
  }, [reports]);

  const [selectedDistrict, setSelectedDistrict] = useState(districts[0] || 'Colombo');

  useEffect(() => {
    if (!districts.includes(selectedDistrict)) {
      setSelectedDistrict(districts[0] || 'Colombo');
    }
  }, [districts, selectedDistrict]);

  const districtReports = useMemo(
    () => reports.filter((report) => districtFromLocation(report.location_name) === selectedDistrict),
    [reports, selectedDistrict],
  );

  const currentRisk = useMemo(() => {
    if (districtReports.length === 0) return 'LOW';
    const top = districtReports.reduce((best, report) => {
      return (SEVERITY_WEIGHT[report.severity_level] || 0) > (SEVERITY_WEIGHT[best.severity_level] || 0) ? report : best;
    }, districtReports[0]);
    return top.severity_level === 'MEDIUM' ? 'MODERATE' : top.severity_level;
  }, [districtReports]);

  const populationExposed = compactNumber(districtReports.length * 1250);
  const shelterStatus = useMemo(() => {
    if (dashboardResources.length === 0) return 0;
    const operational = dashboardResources.filter((resource) => resource.visible && resource.status !== 'CLOSED' && resource.status !== 'FULL').length;
    return Math.round((operational / dashboardResources.length) * 100);
  }, [dashboardResources]);

  const trendData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = new Array(7).fill(0);
    districtReports.forEach((report) => {
      const dayIndex = new Date(report.timestamp).getDay();
      buckets[dayIndex] += SEVERITY_WEIGHT[report.severity_level] || 0;
    });
    return labels.map((name, index) => ({ name, risk: buckets[index] || 8 }));
  }, [districtReports]);

  const priorityZones = useMemo(() => mapZones
    .filter((zone) => zone.visible)
    .slice(0, 3)
    .map((zone) => {
      const status = zone.zoneType === 'critical' ? 'EVACUATE' : zone.zoneType === 'high-risk' ? 'ALERT' : 'SAFE';
      const color = status === 'EVACUATE' ? 'text-red-600' : status === 'ALERT' ? 'text-yellow-400' : 'text-green-600';
      return {
        name: zone.name,
        status,
        color,
      };
    }), [mapZones]);

  const boatsInUse = districtReports.filter((report) => report.status === 'response_dispatched').length;
  const availableShelters = dashboardResources.filter((resource) => resource.status !== 'FULL').length;
  const personnel = districtReports.reduce((total, report) => total + Math.round(report.trust_score / 2), 0);

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            District Command
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            SELECT DISTRICT FOR DETAILED INTEL
          </p>
        </div>
        <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="bg-gray-800 border border-gray-700 text-white px-4 py-3 font-bold uppercase text-sm focus:border-blue-400 outline-none rounded-lg transition-colors">
          {districts.map((district) => <option key={district} value={district}>{district}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-red-600">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Current Risk
              </div>
              <div className="text-3xl font-bold text-red-600">
                {currentRisk}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-blue-400">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Population Exposed
              </div>
              <div className="text-3xl font-bold text-white">
                {populationExposed}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-yellow-400">
              <div className="text-xs text-gray-400 uppercase font-bold mb-2">
                Shelter Status
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {shelterStatus}%
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-64">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Risk Trend (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="risk" stroke="#DC2626" fillOpacity={1} fill="url(#colorRisk)" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
                High Priority Zones
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {priorityZones.map((zone, index) => <li key={zone.name + index} className="flex justify-between border-b border-gray-700 pb-2">
                    <span>{zone.name}</span>
                    <span className={`${zone.color} font-bold`}>{zone.status}</span>
                  </li>)}
              </ul>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
                Resource Allocation
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Boats</span>
                  <span className="font-semibold">{boatsInUse}/{Math.max(evacuationRoutes.length, boatsInUse)}</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Trucks</span>
                  <span className="font-semibold">{availableShelters}/{Math.max(dashboardResources.length, availableShelters)}</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Personnel</span>
                  <span className="font-semibold">{personnel}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-64 flex flex-col">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
              <Map size={18} /> District Map
            </h3>
            <div className="flex-1 bg-gray-950 border border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs font-semibold">
              [DISTRICT MAP]
            </div>
          </div>

          <button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm rounded-lg transition-colors">
            Generate Briefing (PDF)
          </button>

          <button className="w-full py-3 px-6 bg-gray-800 border border-red-600 text-red-600 font-bold uppercase text-sm hover:bg-red-600/10 rounded-lg transition-colors">
            Declare Emergency
          </button>
        </div>
      </div>
    </div>;
}