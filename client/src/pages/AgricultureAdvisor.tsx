import { useState, useEffect } from 'react';
import { Sprout, CloudRain, Droplets, ShieldCheck, type LucideIcon } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useAdminControlStore } from '../stores/adminControlStore';

const ICON_MAP: Record<string, LucideIcon> = { Sprout, CloudRain, Droplets, ShieldCheck };

export function AgricultureAdvisor() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);
  const agricultureAdvisories = useAdminControlStore((s) => s.agricultureAdvisories);
  const agricultureActions = useAdminControlStore((s) => s.agricultureActions);
  const agricultureZones = useAdminControlStore((s) => s.agricultureZones);
  const inundationForecasts = useAdminControlStore((s) => s.inundationForecasts);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 pb-xl bg-bg-primary">
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

        {isLoading ? (
          <div className="space-y-6">
            <LoadingSkeleton count={4} variant="metric" />
            <LoadingSkeleton count={2} variant="card" height="h-32" />
          </div>
        ) : (
        <>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          {agricultureAdvisories.map((adv) => {
            const Icon = ICON_MAP[adv.iconName] || Sprout;
            return (
              <UnifiedCard key={adv.id}>
                <Icon size={32} className="mb-md text-safe" strokeWidth={1.5} />
                <h3 className="text-base font-bold uppercase mb-md text-text-primary">
                  {adv.cropName}
                </h3>
                <div className={`inline-block ${adv.statusColor} text-xs font-bold px-md py-xs rounded-card mb-md`}>
                  {adv.statusLabel}
                </div>
                <p className="font-semibold text-xs text-text-secondary leading-snug">
                  {adv.message}
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
              {[...agricultureActions].sort((a, b) => a.order - b.order).map((action) => (
                <li key={action.id} className="flex items-start gap-md">
                  <div className="w-6 h-6 bg-safe text-white flex items-center justify-center font-bold shrink-0 rounded-card text-xs">
                    {action.order}
                  </div>
                  <p className="font-semibold text-sm text-text-primary mt-0.5">{action.text}</p>
                </li>
              ))}
            </ul>
          </UnifiedCard>

          {/* Inundation Forecast */}
          <UnifiedCard title="Inundation Forecast" accentColor="critical">
            <div className="space-y-md max-h-96 overflow-y-auto">
              {inundationForecasts.map((forecast) => (
                <div
                  key={forecast.id}
                  className={`p-md rounded-lg border-l-4 border-l-white ${forecast.color} text-white`}
                >
                  <div className="flex justify-between items-start mb-md">
                    <div>
                      <p className="font-bold text-sm uppercase mb-xs">{forecast.district}</p>
                      <p className="text-xs opacity-90">{forecast.expectedLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">{forecast.waterHeightCm} cm</p>
                      <p className="text-xs opacity-90">{forecast.rainfallMm}mm rain</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md text-xs">
                    <div>
                      <span className="opacity-75">Flooding in:</span>
                      <p className="font-semibold">{forecast.timeToFlood}</p>
                    </div>
                    <div>
                      <span className="opacity-75">Affected Area:</span>
                      <p className="font-semibold">{forecast.affectedArea}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </UnifiedCard>
        </div>

        {/* Risk Zones Grid */}
        <div className="mt-xl">
          <h3 className="text-lg font-bold uppercase mb-lg text-text-primary">Affected Risk Zones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {agricultureZones.map((zone) => (
              <UnifiedCard key={zone.id} accentColor={zone.accentColor}>
                <p className="text-xs font-bold uppercase mb-md" style={{ color: zone.accentColor === 'critical' ? '#dc2626' : zone.accentColor === 'warning' ? '#f97316' : '#16a34a' }}>{zone.label}</p>
                <p className="font-bold text-sm text-text-primary">{zone.district}</p>
                <p className="text-xs text-text-secondary mt-md">{zone.details}</p>
              </UnifiedCard>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}