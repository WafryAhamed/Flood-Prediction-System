import React from 'react';
import { Sprout, CloudRain, Droplets, ShieldCheck } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';

export function AgricultureAdvisor() {
  const crops = [
    {
      name: 'Paddy',
      icon: Sprout,
      color: 'text-safe',
      statusColor: 'bg-critical/10 text-critical',
      message: 'High risk of submersion in next 48h. Delay planting.'
    },
    {
      name: 'Rainfall',
      icon: CloudRain,
      color: 'text-info',
      statusColor: 'bg-warning/10 text-warning',
      message: 'Expected 120mm. Exceeds drainage capacity.'
    },
    {
      name: 'Soil Moisture',
      icon: Droplets,
      color: 'text-info',
      statusColor: 'bg-caution/10 text-caution',
      message: 'Saturation at 95%. No irrigation needed.'
    },
    {
      name: 'Insurance',
      icon: ShieldCheck,
      color: 'text-safe',
      statusColor: 'bg-safe/10 text-safe',
      message: 'Active scheme available for your zone.'
    }
  ];

  return (
    <div className="min-h-screen px-lg px-lg md:px-xl pb-xl bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-xl">
          <div className="inline-block bg-safe text-white px-lg py-sm font-bold text-xs uppercase tracking-widest mb-md rounded-card">
            Livelihood Protection
          </div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary">
            Agriculture Advisor
          </h1>
        </header>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          {crops.map((crop, i) => {
            const Icon = crop.icon;
            return (
              <UnifiedCard key={i}>
                <Icon size={32} className={`mb-md ${crop.color}`} strokeWidth={1.5} />
                <h3 className="text-base font-bold uppercase mb-md text-text-primary">
                  {crop.name}
                </h3>
                <div className={`inline-block ${crop.statusColor} text-xs font-bold px-md py-xs rounded-card mb-md`}>
                  Alert
                </div>
                <p className="font-semibold text-xs text-text-secondary leading-snug">
                  {crop.message}
                </p>
              </UnifiedCard>
            );
          })}
        </div>

        {/* Action Plan and Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          {/* Action Plan */}
          <UnifiedCard title="Action Plan: Next 7 Days" accentColor="safe">
            <ul className="space-y-md">
              {[
                'Clear field drainage channels immediately',
                'Harvest mature crops if possible before Friday',
                'Store seeds on elevated platforms',
                'Move livestock to higher grazing grounds'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-md">
                  <div className="w-6 h-6 bg-safe text-white flex items-center justify-center font-bold shrink-0 rounded-card text-xs">
                    {i + 1}
                  </div>
                  <p className="font-semibold text-sm text-text-primary mt-0.5">{tip}</p>
                </li>
              ))}
            </ul>
          </UnifiedCard>

          {/* Inundation Forecast */}
          <UnifiedCard title="Inundation Forecast">
            <div className="h-64 bg-bg-primary border border-border-light rounded-card flex items-center justify-center">
              <p className="font-semibold uppercase text-text-secondary text-sm">
                Map Visualization Placeholder
              </p>
            </div>
          </UnifiedCard>
        </div>

        {/* Risk Zones Grid */}
        <div className="mt-xl">
          <h3 className="text-lg font-bold uppercase mb-lg text-text-primary">Affected Risk Zones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <UnifiedCard accentColor="critical">
              <p className="text-xs font-bold text-red-600 uppercase mb-md">High Risk</p>
              <p className="font-bold text-sm text-text-primary">Colombo District, Zone A</p>
              <p className="text-xs text-text-secondary mt-md">Expected 3-4 days of flooding</p>
            </UnifiedCard>
            <UnifiedCard accentColor="warning">
              <p className="text-xs font-bold text-orange-500 uppercase mb-md">Moderate Risk</p>
              <p className="font-bold text-sm text-text-primary">Gampaha District</p>
              <p className="text-xs text-text-secondary mt-md">Expected 1-2 days of rainfall</p>
            </UnifiedCard>
            <UnifiedCard accentColor="safe">
              <p className="text-xs font-bold text-green-600 uppercase mb-md">Low Risk</p>
              <p className="font-bold text-sm text-text-primary">Kalutara District</p>
              <p className="text-xs text-text-secondary mt-md">Expected clear conditions</p>
            </UnifiedCard>
          </div>
        </div>
      </div>
    </div>
  );
}