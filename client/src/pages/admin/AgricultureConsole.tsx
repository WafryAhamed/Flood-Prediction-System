import React, { useMemo } from 'react';
import { Sprout, CloudRain, Droplets, Tractor, AlertTriangle, TrendingDown, Wheat, Fish, Bug, BarChart3, Clock, MapPin, Users, Truck, ShieldAlert, Thermometer } from 'lucide-react';
import { useAdminControlStore } from '../../stores/adminControlStore';
import { useReportStore } from '../../stores/reportStore';
import { useWeatherData } from '../../hooks/useWeatherData';

export function AgricultureConsole() {
  const agricultureZones = useAdminControlStore((s) => s.agricultureZones);
  const agricultureAdvisories = useAdminControlStore((s) => s.agricultureAdvisories);
  const agricultureActions = useAdminControlStore((s) => s.agricultureActions);
  const recoveryProgress = useAdminControlStore((s) => s.recoveryProgress);
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);
  const dashboardResources = useAdminControlStore((s) => s.dashboardResources);
  const reports = useReportStore((s) => s.reports);
  const { weather } = useWeatherData();

  const districts = useMemo(() => {
    const source = agricultureZones.length > 0 ? agricultureZones : [{ id: 'fallback', district: 'Colombo District', riskLevel: 'HIGH' as const }];
    return source.map((zone, index) => {
      const districtName = zone.district.split(',')[0].trim();
      const zoneReports = reports.filter((report) => report.location_name.toLowerCase().includes(districtName.toLowerCase()));
      const farmers = 900 + zoneReports.length * 320 + index * 140;
      const area = 3200 + zoneReports.length * 550 + index * 900;
      const rainfallDepth = ((weather?.rainfall ?? 1.8) / 4 + index * 0.08).toFixed(1);
      return {
        name: districtName,
        crop: agricultureAdvisories[index % Math.max(agricultureAdvisories.length, 1)]?.cropName || 'Mixed',
        risk: zone.riskLevel === 'CRITICAL' ? 'Critical' : zone.riskLevel === 'HIGH' ? 'High' : zone.riskLevel === 'MODERATE' ? 'Moderate' : 'Low',
        depth: `${rainfallDepth}m`,
        area: `${area.toLocaleString()} Ha`,
        farmers,
      };
    });
  }, [agricultureZones, agricultureAdvisories, reports, weather]);

  const cropBreakdown = useMemo(() => {
    const palette = ['bg-red-500', 'bg-yellow-400', 'bg-green-400', 'bg-orange-400', 'bg-blue-400'];
    const source = agricultureAdvisories.length > 0 ? agricultureAdvisories : [{ cropName: 'Paddy', statusLabel: 'Alert' }];
    return source.slice(0, 5).map((advisory, index) => {
      const baseLoss = advisory.statusLabel.toLowerCase().includes('alert') ? 12 : 6;
      const pctLoss = Math.min(35, baseLoss + index * 3 + Math.round((weather?.rainfall ?? 0) / 2));
      const area = 1200 + index * 1800 + reports.length * 40;
      return {
        type: advisory.cropName,
        area: `${area.toLocaleString()} Ha`,
        pctLoss,
        color: palette[index % palette.length],
      };
    });
  }, [agricultureAdvisories, weather, reports]);

  const recentAdvisories = useMemo(() => {
    const fromBroadcast = broadcastFeed
      .filter((item) => item.active)
      .slice(0, 3)
      .map((item) => ({
        time: item.time,
        msg: item.text,
        severity: item.type === 'critical' ? 'critical' : item.type === 'warning' ? 'high' : 'moderate',
      }));

    const fromActions = agricultureActions.slice(0, 2).map((action, index) => ({
      time: new Date(Date.now() - index * 45 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      msg: action.text,
      severity: 'moderate',
    }));

    return [...fromBroadcast, ...fromActions];
  }, [broadcastFeed, agricultureActions]);

  const totalCropExposure = districts.reduce((sum, district) => sum + Number(district.area.replace(/[^0-9]/g, '')), 0);
  const farmersAffected = districts.reduce((sum, district) => sum + district.farmers, 0);
  const projectedLossLkrM = Math.max(25, Math.round(totalCropExposure * ((weather?.rainfall ?? 3) / 100)));
  const livestockAtRisk = Math.round(farmersAffected * 0.65);
  const reliefDeployed = recoveryProgress.length > 0
    ? Math.round(recoveryProgress.reduce((sum, item) => sum + item.percent, 0) / recoveryProgress.length)
    : 0;

  const planningBars = [
    { label: 'Seed Distribution', value: recoveryProgress[0]?.percent ?? 45, color: 'bg-blue-400' },
    { label: 'Compensation Fund', value: recoveryProgress[2]?.percent ?? 12, color: 'bg-yellow-400' },
    { label: 'Equipment Dispatch', value: recoveryProgress[1]?.percent ?? 62, color: 'bg-green-400' },
    { label: 'Labor Assistance', value: Math.round((recoveryProgress[3]?.percent ?? 56) * 0.5), color: 'bg-purple-400' },
    { label: 'Livestock Feed', value: Math.max(10, Math.round(reliefDeployed * 0.6)), color: 'bg-orange-400' },
  ];

  const teamsDeployed = `${dashboardResources.filter((resource) => resource.visible).length}/${Math.max(10, dashboardResources.length + 6)}`;
  const pumpsActive = Math.max(4, Math.round((weather?.rainfall ?? 2) * 3));
  const drainageCleared = `${Math.max(20, Math.round((recoveryProgress[0]?.percent ?? 55) * 0.8))}%`;
  const livestockShelters = Math.max(2, dashboardResources.filter((resource) => resource.status !== 'FULL').length);
  const soilSamplesPending = Math.max(20, reports.filter((report) => report.status === 'pending').length * 18);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-yellow-400';
      case 'Moderate': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-600 bg-red-950/30';
      case 'high': return 'border-l-yellow-400 bg-yellow-950/20';
      default: return 'border-l-blue-400 bg-blue-950/20';
    }
  };

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Agriculture & Livelihood Command
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            CROP RISK ANALYSIS • SEASON: MAHA 2024 • LAST UPDATED: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-gray-700 text-gray-200 font-bold uppercase text-sm hover:bg-gray-600 flex items-center gap-2 rounded transition-colors">
            <BarChart3 size={18} /> Export Report
          </button>
          <button className="px-6 py-3 bg-yellow-400 text-black font-bold uppercase text-sm hover:bg-yellow-500 flex items-center gap-2 rounded transition-colors">
            <AlertTriangle size={18} /> Issue Farmer Advisory
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-red-600 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Crop Exposure</div>
          <div className="text-xl font-bold text-red-600">{totalCropExposure.toLocaleString()} Ha</div>
          <div className="text-[10px] text-red-600">High Risk Zone</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-blue-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Farmers Affected</div>
          <div className="text-xl font-bold text-white">{farmersAffected.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">Est. Households</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-yellow-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Proj. Economic Loss</div>
          <div className="text-xl font-bold text-yellow-400">LKR {projectedLossLkrM}M</div>
          <div className="text-[10px] text-yellow-400">-15% Yield</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-orange-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Livestock at Risk</div>
          <div className="text-xl font-bold text-orange-400">{livestockAtRisk.toLocaleString()}</div>
          <div className="text-[10px] text-orange-400">Cattle & Poultry</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-purple-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Districts Affected</div>
          <div className="text-xl font-bold text-purple-400">{districts.length}</div>
          <div className="text-[10px] text-purple-400">2 Critical</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-green-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Relief Deployed</div>
          <div className="text-xl font-bold text-green-400">{reliefDeployed}%</div>
          <div className="text-[10px] text-green-400">Of Total Allocation</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] flex flex-col rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
              <Sprout size={18} /> Crop Risk Map
            </h3>
            <div className="flex-1 bg-gray-950 border border-gray-700 flex items-center justify-center text-gray-600 text-xs font-semibold relative rounded">
              [SATELLITE CROP HEALTH LAYER]
              <div className="absolute bottom-4 right-4 bg-gray-900/90 p-2 border border-gray-700 rounded">
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-red-600"></span> Inundated (&gt;1m)
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-yellow-400"></span> Waterlogged
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <span className="w-2 h-2 bg-green-500"></span> Safe
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-gray-900/90 px-3 py-1.5 border border-gray-700 rounded text-[10px] text-gray-300 flex items-center gap-2">
                <Thermometer size={12} /> Soil Moisture: {Math.min(99, Math.max(45, Math.round((weather?.rainfall ?? 1) * 12)))}% (Saturated)
              </div>
            </div>
          </div>

          {/* Crop Type Breakdown */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <Wheat size={18} /> Crop Type Breakdown
            </h3>
            <div className="space-y-3">
              {cropBreakdown.map((crop, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-gray-300 w-32 shrink-0">{crop.type}</span>
                  <div className="flex-1 bg-gray-900 h-2 rounded overflow-hidden">
                    <div className={`${crop.color} h-full rounded`} style={{ width: `${crop.pctLoss * 4}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-400 w-20 text-right">{crop.area}</span>
                  <span className={`text-xs font-bold w-12 text-right ${crop.pctLoss > 15 ? 'text-red-500' : crop.pctLoss > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                    -{crop.pctLoss}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Advisories Feed */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <Clock size={18} /> Recent Advisory Activity
            </h3>
            <div className="space-y-2">
              {recentAdvisories.map((adv, i) => (
                <div key={i} className={`p-3 border-l-4 rounded ${getSeverityColor(adv.severity)}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5 shrink-0">{adv.time}</span>
                    <span className="text-xs text-gray-300">{adv.msg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin size={16} /> Priority Districts</span>
              <span className="text-[10px] text-gray-500">{districts.length} monitored</span>
            </h3>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {districts.map((d, i) => <div key={i} className="p-4 bg-gray-900 border border-gray-700 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-white">
                      {d.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${getRiskColor(d.risk)}`}>
                      {d.risk}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{d.crop}</span>
                    <span>Est. Depth: {d.depth}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Sprout size={10} /> {d.area}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {d.farmers.toLocaleString()} farmers</span>
                  </div>
                </div>)}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Relief Planning
            </h3>
            <div className="space-y-4">
              {planningBars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{bar.label}</span>
                    <span className="text-gray-300">{bar.value}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1.5 rounded">
                    <div className={`${bar.color} h-full rounded`} style={{ width: `${bar.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 border border-gray-700 text-sm font-bold uppercase text-gray-300 hover:bg-gray-700 rounded transition-colors">
              Manage Relief
            </button>
          </div>

          {/* Field Operations */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <Truck size={16} /> Field Operations
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Teams Deployed</span>
                <span className="text-xs font-bold text-green-400">{teamsDeployed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Water Pumps Active</span>
                <span className="text-xs font-bold text-blue-400">{pumpsActive}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Drainage Cleared</span>
                <span className="text-xs font-bold text-yellow-400">{drainageCleared}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Shelters for Livestock</span>
                <span className="text-xs font-bold text-orange-400">{livestockShelters} active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Soil Samples Pending</span>
                <span className="text-xs font-bold text-purple-400">{soilSamplesPending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}