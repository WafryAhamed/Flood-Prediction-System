import React, { useMemo } from 'react';
import { Building2, Plus, AlertTriangle, Users, MapPin, Bus } from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import { useAdminControlStore } from '../../stores/adminControlStore';
import { useReportStore } from '../../stores/reportStore';

function districtFromLocation(location: string): string {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || location;
}

export function FacilityManagement() {
  const mapMarkers = useMaintenanceStore((s) => s.mapMarkers);
  const evacuationRoutes = useMaintenanceStore((s) => s.evacuationRoutes);
  const dashboardResources = useAdminControlStore((s) => s.dashboardResources);
  const reports = useReportStore((s) => s.reports);

  const facilities = useMemo(() => {
    const resourceByName = new Map(dashboardResources.map((resource) => [resource.name.toLowerCase(), resource]));
    return mapMarkers
      .filter((marker) => marker.visible && (marker.markerType === 'shelter' || marker.markerType === 'hospital'))
      .slice(0, 8)
      .map((marker, index) => {
        const linkedResource = Array.from(resourceByName.entries()).find(([name]) => marker.label.toLowerCase().includes(name))?.[1];
        const status = linkedResource?.status === 'FULL'
          ? 'Active'
          : linkedResource?.status === 'OPEN' || linkedResource?.status === 'AVAILABLE'
            ? 'Operational'
            : 'Standby';
        const cap = linkedResource?.status === 'FULL'
          ? 92
          : linkedResource?.status === 'BUSY'
            ? 78
            : 35 + index * 8;

        const relatedReport = reports.find((report) => report.location_name.toLowerCase().includes(districtFromLocation(marker.label).toLowerCase()));
        const risk = relatedReport?.severity_level === 'CRITICAL'
          ? 'High'
          : relatedReport?.severity_level === 'HIGH'
            ? 'Moderate'
            : 'Low';

        return {
          name: marker.label,
          type: marker.markerType === 'hospital' ? 'Hospital' : 'Evac Center',
          status,
          cap: Math.min(99, Math.max(10, Math.round(cap))),
          risk,
        };
      });
  }, [mapMarkers, dashboardResources, reports]);

  const totalCapacity = facilities.length * 1000;
  const currentOccupancy = Math.round(facilities.reduce((sum, facility) => sum + facility.cap, 0) / 100 * 1000);
  const atRiskFacilities = facilities.filter((facility) => facility.risk === 'High').length;
  const transportUnits = evacuationRoutes.filter((route) => route.status === 'active').length * 6;

  const criticalAlerts = useMemo(() => {
    const fromCapacity = facilities.filter((facility) => facility.cap >= 90).map((facility) => `${facility.name} approaching max capacity (${facility.cap}%)`);
    const fromRoutes = evacuationRoutes.filter((route) => route.status === 'blocked').map((route) => `Access route blocked: ${route.name}`);
    return [...fromCapacity, ...fromRoutes].slice(0, 3);
  }, [facilities, evacuationRoutes]);

  const availability = totalCapacity === 0 ? 0 : Math.max(0, Math.round((1 - currentOccupancy / totalCapacity) * 100));

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Evacuation Operations
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            NETWORK STATUS: {availability}% OPERATIONAL • {facilities.filter((facility) => facility.status === 'Operational' || facility.status === 'Active').length} ACTIVE SHELTERS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm flex items-center gap-2 rounded-lg transition-colors">
            <Plus size={18} /> Activate New Shelter
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-green-600">
          <div className="text-xs text-gray-400 uppercase font-bold mb-2">
            Total Capacity
          </div>
          <div className="text-2xl font-bold text-white">
            {totalCapacity.toLocaleString()}
          </div>
          <div className="text-xs text-green-500 font-semibold">{availability}% Available</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-yellow-400">
          <div className="text-xs text-gray-400 uppercase font-bold mb-2">
            Current Occupancy
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {currentOccupancy.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-400 font-semibold">Live occupancy estimate</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-red-600">
          <div className="text-xs text-gray-400 uppercase font-bold mb-2">
            At Risk Facilities
          </div>
          <div className="text-2xl font-bold text-red-600">
            {atRiskFacilities}
          </div>
          <div className="text-xs text-red-600 font-semibold">Flood imminent</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-blue-400">
          <div className="text-xs text-gray-400 uppercase font-bold mb-2">
            Transport Units
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {transportUnits}
          </div>
          <div className="text-xs text-blue-400 font-semibold">Active on routes</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility List */}
        <div className="lg:col-span-2 space-y-4">
          {facilities.map((f, i) => <div key={i} className="bg-[#132F4C] border border-[#1E4976] p-4 flex items-center gap-4 hover:border-[#00E5FF] transition-colors group">
              <div className={`w-12 h-12 flex items-center justify-center border ${f.risk === 'High' ? 'bg-[#FF1744]/10 border-[#FF1744] text-[#FF1744]' : 'bg-[#0A1929] border-[#1E4976] text-[#00E5FF]'}`}>
                <Building2 size={24} />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white group-hover:text-[#00E5FF]">
                    {f.name}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${f.status === 'Active' ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-gray-700 text-gray-300'}`}>
                    {f.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> Sector 4
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus size={14} /> Route A-12
                  </span>
                  {f.risk === 'High' && <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> HIGH RISK
                    </span>}
                </div>

                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${f.cap > 90 ? 'bg-red-600' : f.cap > 70 ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{
                width: `${f.cap}%`
              }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs font-semibold">
                  <span className="text-gray-500">Occupancy</span>
                  <span className={f.cap > 90 ? 'text-red-600' : 'text-gray-300'}>
                    {f.cap}% Full
                  </span>
                </div>
              </div>

              <button className="px-3 py-1 border border-gray-700 text-xs font-bold uppercase text-gray-300 hover:bg-gray-700 rounded transition-colors">
                Manage
              </button>
            </div>)}
        </div>

        {/* Map/Alerts Panel */}
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-64 flex flex-col">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
              <MapPin size={18} /> Shelter Map
            </h3>
            <div className="flex-1 bg-gray-950 border border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs font-semibold">
              [MAP VISUALIZATION]
            </div>
          </div>

          <div className="bg-red-600/10 border border-red-600 rounded-lg p-6">
            <h3 className="text-sm font-bold uppercase text-red-600 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} /> Critical Alerts
            </h3>
            <ul className="space-y-2 text-xs">
              {criticalAlerts.map((alert, index) => <li key={index} className="flex gap-2 text-gray-300">
                  <span className="text-red-600 font-bold">•</span>
                  {alert}
                </li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>;
}