import React from 'react';
import { Sprout, CloudRain, Droplets, Tractor, AlertTriangle, TrendingDown, Wheat, Fish, Bug, BarChart3, Clock, MapPin, Users, Truck, ShieldAlert, Thermometer } from 'lucide-react';
export function AgricultureConsole() {
  const districts = [
    { name: 'Polonnaruwa', crop: 'Paddy', risk: 'Critical', depth: '1.2m', area: '12,400 Ha', farmers: 3200 },
    { name: 'Anuradhapura', crop: 'Paddy', risk: 'High', depth: '0.8m', area: '9,800 Ha', farmers: 2850 },
    { name: 'Kurunegala', crop: 'Vegetable', risk: 'High', depth: '0.6m', area: '7,200 Ha', farmers: 2100 },
    { name: 'Batticaloa', crop: 'Paddy', risk: 'Moderate', depth: '0.4m', area: '5,600 Ha', farmers: 1800 },
    { name: 'Trincomalee', crop: 'Mixed', risk: 'Moderate', depth: '0.3m', area: '4,100 Ha', farmers: 1450 },
    { name: 'Matale', crop: 'Vegetable', risk: 'Low', depth: '0.2m', area: '3,200 Ha', farmers: 980 },
  ];

  const cropBreakdown = [
    { type: 'Paddy (Rice)', area: '28,400 Ha', pctLoss: 22, color: 'bg-red-500' },
    { type: 'Vegetables', area: '8,600 Ha', pctLoss: 14, color: 'bg-yellow-400' },
    { type: 'Coconut', area: '4,200 Ha', pctLoss: 6, color: 'bg-green-400' },
    { type: 'Banana & Fruits', area: '2,800 Ha', pctLoss: 10, color: 'bg-orange-400' },
    { type: 'Other Crops', area: '1,200 Ha', pctLoss: 4, color: 'bg-blue-400' },
  ];

  const recentAdvisories = [
    { time: '08:30', msg: 'Polonnaruwa — immediate paddy harvest advisory issued', severity: 'critical' },
    { time: '07:15', msg: 'Anuradhapura — water pumping operations initiated in 12 zones', severity: 'high' },
    { time: '06:00', msg: 'Kurunegala — vegetable salvage teams deployed to 8 divisions', severity: 'high' },
    { time: '04:45', msg: 'Batticaloa — drainage canal capacity at 85%, monitoring active', severity: 'moderate' },
    { time: '03:20', msg: 'Trincomalee — livestock relocation advisory for coastal farms', severity: 'moderate' },
  ];

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
          <div className="text-xl font-bold text-red-600">45,200 Ha</div>
          <div className="text-[10px] text-red-600">High Risk Zone</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-blue-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Farmers Affected</div>
          <div className="text-xl font-bold text-white">12,850</div>
          <div className="text-[10px] text-gray-400">Est. Households</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-yellow-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Proj. Economic Loss</div>
          <div className="text-xl font-bold text-yellow-400">LKR 450M</div>
          <div className="text-[10px] text-yellow-400">-15% Yield</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-orange-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Livestock at Risk</div>
          <div className="text-xl font-bold text-orange-400">8,400</div>
          <div className="text-[10px] text-orange-400">Cattle & Poultry</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-purple-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Districts Affected</div>
          <div className="text-xl font-bold text-purple-400">6</div>
          <div className="text-[10px] text-purple-400">2 Critical</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-green-400 p-4 rounded-lg">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Relief Deployed</div>
          <div className="text-xl font-bold text-green-400">38%</div>
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
                <Thermometer size={12} /> Soil Moisture: 87% (Saturated)
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
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Seed Distribution</span>
                  <span className="text-blue-400">45%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-blue-400 h-full rounded" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Compensation Fund</span>
                  <span className="text-yellow-400">12%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-yellow-400 h-full rounded" style={{ width: '12%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Equipment Dispatch</span>
                  <span className="text-green-400">62%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-green-400 h-full rounded" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Labor Assistance</span>
                  <span className="text-purple-400">28%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-purple-400 h-full rounded" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Livestock Feed</span>
                  <span className="text-orange-400">35%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded">
                  <div className="bg-orange-400 h-full rounded" style={{ width: '35%' }}></div>
                </div>
              </div>
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
                <span className="text-xs font-bold text-green-400">24 / 30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Water Pumps Active</span>
                <span className="text-xs font-bold text-blue-400">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Drainage Cleared</span>
                <span className="text-xs font-bold text-yellow-400">67%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Shelters for Livestock</span>
                <span className="text-xs font-bold text-orange-400">12 active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Soil Samples Pending</span>
                <span className="text-xs font-bold text-purple-400">140</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}