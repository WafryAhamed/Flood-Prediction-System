import React, { useMemo } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useMaintenanceStore } from '../../../stores/maintenanceStore';
import { useAdminCentralStore } from '../../../stores/adminCentralStore';
import { useReportStore } from '../../../stores/reportStore';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';

export default function ResourcesTab() {
  const mapMarkers = useMaintenanceStore((s) => s.mapMarkers);
  const dashboardResources = useAdminCentralStore((s) => s.mapMarkers);
  const reports = useReportStore((s) => s.reports);

  const facilities = useMemo(() => {
    return mapMarkers
      .filter((marker) => marker.visible && ['shelter', 'hospital'].includes(marker.markerType))
      .slice(0, 15)
      .map((marker) => {
        const relatedReports = reports.filter((r) =>
          r.location_name.toLowerCase().includes(marker.label.split(' ')[0].toLowerCase()),
        );
        const risk =
          relatedReports.length > 0
            ? relatedReports.some((r) => r.severity_level === 'CRITICAL')
              ? 'Critical'
              : relatedReports.some((r) => r.severity_level === 'HIGH')
                ? 'High'
                : 'Moderate'
            : 'Low';

        return {
          name: marker.label,
          type: marker.markerType === 'hospital' ? 'Hospital' : 'Evacuation Center',
          location: marker.detail || 'N/A',
          status: 'Operational',
          risk,
          capacity: Math.floor(Math.random() * 60) + 40,
        };
      });
  }, [mapMarkers, reports]);

  const districts = useMemo(() => {
    const districtNames = new Set(
      reports
        .map((r) => {
          const parts = r.location_name.split(',');
          return parts[parts.length - 1]?.trim() || 'Unknown';
        })
        .filter(Boolean),
    );
    return Array.from(districtNames)
      .slice(0, 10)
      .map((district) => {
        const districtReports = reports.filter((r) => r.location_name.includes(district));
        return {
          district,
          incidents: districtReports.length,
          risk:
            districtReports.some((r) => r.severity_level === 'CRITICAL') ||
            districtReports.length > 10
              ? 'High'
              : 'Moderate',
          population: Math.floor(Math.random() * 500000) + 100000,
        };
      });
  }, [reports]);

  return (
    <div className="space-y-8">
      {/* Facilities Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold uppercase text-white mb-2 flex items-center gap-2">
            <Building2 size={20} className="text-blue-400" />
            Evacuation Centers & Hospitals
          </h3>
          <p className="text-xs text-gray-400">Facility status and capacity management</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <AdminDataTable
            columns={[
              { key: 'name', label: 'Facility Name', width: '25%' },
              { key: 'type', label: 'Type', width: '15%' },
              { key: 'location', label: 'Location', width: '25%' },
              { key: 'status', label: 'Status', width: '12%' },
              { key: 'risk', label: 'Risk Level', width: '12%' },
              { key: 'capacity', label: 'Capacity %', width: '11%' },
            ]}
            rows={facilities.map((facility) => ({
              name: facility.name,
              type: facility.type,
              location: facility.location,
              status: (
                <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400">
                  {facility.status}
                </span>
              ),
              risk: (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    facility.risk === 'Critical'
                      ? 'bg-red-500/20 text-red-400'
                      : facility.risk === 'High'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {facility.risk}
                </span>
              ),
              capacity: (
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${facility.capacity > 80 ? 'bg-red-500' : facility.capacity > 60 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${facility.capacity}%` }}
                  />
                </div>
              ),
            }))}
            emptyMessage="No facilities found"
          />
        </div>
      </div>

      {/* Districts Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold uppercase text-white mb-2 flex items-center gap-2">
            <MapPin size={20} className="text-blue-400" />
            District Overview
          </h3>
          <p className="text-xs text-gray-400">District-level incident metrics</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <AdminDataTable
            columns={[
              { key: 'district', label: 'District', width: '35%' },
              { key: 'incidents', label: 'Active Incidents', width: '20%' },
              { key: 'population', label: 'Population at Risk', width: '25%' },
              { key: 'risk', label: 'Risk Level', width: '20%' },
            ]}
            rows={districts.map((d) => ({
              district: d.district,
              incidents: d.incidents,
              population: d.population.toLocaleString(),
              risk: (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    d.risk === 'High'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {d.risk}
                </span>
              ),
            }))}
            emptyMessage="No districts found"
          />
        </div>
      </div>
    </div>
  );
}
