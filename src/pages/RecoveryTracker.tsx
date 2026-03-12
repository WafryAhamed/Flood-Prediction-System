import { useState, useEffect } from 'react';
import { CheckCircle, Truck, Hammer, HeartHandshake, type LucideIcon } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useAdminControlStore } from '../stores/adminControlStore';

const UPDATE_ICON_MAP: Record<string, LucideIcon> = { CheckCircle, Truck, Hammer, HeartHandshake };
const URGENCY_STYLE: Record<string, { bg: string; label: string }> = {
  CRITICAL: { bg: 'bg-critical', label: 'Critical' },
  HIGH: { bg: 'bg-warning', label: 'High' },
  LOW: { bg: 'bg-safe', label: 'Met' },
};

export function RecoveryTracker() {
  const [isLoading, setIsLoading] = useState(true);
  const recoveryProgress = useAdminControlStore((s) => s.recoveryProgress);
  const recoveryNeeds = useAdminControlStore((s) => s.recoveryNeeds);
  const recoveryUpdates = useAdminControlStore((s) => s.recoveryUpdates);
  const recoveryResources = useAdminControlStore((s) => s.recoveryResources);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 pb-xl bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-xl">
          <div className="inline-block bg-info text-white px-lg py-sm font-bold text-xs uppercase tracking-widest mb-md rounded-card">
            Post-Disaster Phase
          </div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary">
            Recovery Tracker
          </h1>
        </header>

        {isLoading ? (
          <div className="space-y-6">
            <LoadingSkeleton count={2} variant="card" height="h-48" />
            <LoadingSkeleton count={3} variant="list" />
          </div>
        ) : (
        <>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl mb-xl">
          {/* Main Recovery Progress */}
          <div className="lg:col-span-2 space-y-xl">
            {/* Progress Bars */}
            <UnifiedCard title="Restoration Progress">
              <div className="space-y-lg">
                {recoveryProgress.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between mb-md font-bold uppercase text-sm text-text-primary">
                      <span>{item.label}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </UnifiedCard>

            {/* Relief Map Placeholder */}
            <UnifiedCard noPadding className="h-80 flex items-center justify-center">
              <p className="font-semibold uppercase text-text-secondary text-sm">
                Relief Camp Map Visualization
              </p>
            </UnifiedCard>
          </div>

          {/* Sidebar: Needs & Actions */}
          <div className="lg:col-span-1 space-y-lg">
            {/* Critical Needs */}
            <UnifiedCard title="Critical Needs" accentColor="critical" subtitle="Urgent items needed">
              <ul className="space-y-md">
                {recoveryNeeds.map((need, idx) => {
                  const style = URGENCY_STYLE[need.urgency] || URGENCY_STYLE.LOW;
                  return (
                    <li key={need.id} className={`flex items-center justify-between ${idx < recoveryNeeds.length - 1 ? 'pb-md border-b border-critical/30' : ''}`}>
                      <span className="font-semibold text-sm text-text-primary">{need.name}</span>
                      <span className={`text-xs font-bold ${style.bg} text-white px-md py-xs rounded-card`}>
                        {style.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <button className="w-full mt-lg bg-critical text-white py-md font-bold uppercase text-sm hover:opacity-90 transition-opacity rounded-card">
                Donate Now
              </button>
            </UnifiedCard>

            {/* File Damage Report */}
            <UnifiedCard title="Report Damage" subtitle="Document property damage">
              <p className="font-semibold text-xs text-text-secondary mb-lg">
                Submit your property damage for government assistance eligibility.
              </p>
              <button className="w-full bg-red-600 text-white py-md font-bold uppercase text-sm hover:opacity-90 transition-opacity rounded-card">
                File Report
              </button>
            </UnifiedCard>

            {/* Recovery Resources */}
            <UnifiedCard title="Recovery Resources" accentColor="info">
              <ul className="space-y-md text-sm text-text-secondary">
                {recoveryResources.map((res) => (
                  <li key={res.id}>
                    <p className="font-bold text-text-primary">{res.name}</p>
                    <p className="text-xs text-text-secondary">{res.detail}</p>
                  </li>
                ))}
              </ul>
            </UnifiedCard>
          </div>
        </div>

        {/* Recent Updates */}
        <div>
          <h3 className="text-lg font-bold uppercase mb-lg text-text-primary">Recent Updates</h3>
          <div className="bg-bg-card border border-border-light p-lg rounded-card shadow-md space-y-md">
            {recoveryUpdates.map((update, idx) => {
              const Icon = UPDATE_ICON_MAP[update.iconName] || CheckCircle;
              return (
                <div key={update.id} className={`flex items-start gap-lg ${idx < recoveryUpdates.length - 1 ? 'pb-md border-b border-border-light' : ''}`}>
                  <Icon size={20} className="text-safe shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="font-bold text-sm text-text-primary">{update.title}</p>
                    <p className="text-xs text-text-secondary">{update.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}