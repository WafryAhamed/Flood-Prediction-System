import React, { useState, useEffect } from 'react';
import { CheckCircle, Truck, Hammer, HeartHandshake } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export function RecoveryTracker() {
  const [isLoading, setIsLoading] = useState(true);

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
                {/* Road Access */}
                <div>
                  <div className="flex justify-between mb-md font-bold uppercase text-sm text-text-primary">
                    <span>Road Access</span>
                    <span className="text-safe">85%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-safe transition-all"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>

                {/* Power Supply */}
                <div>
                  <div className="flex justify-between mb-md font-bold uppercase text-sm text-text-primary">
                    <span>Power Supply</span>
                    <span className="text-caution">60%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-caution transition-all"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>

                {/* Water Safety */}
                <div>
                  <div className="flex justify-between mb-md font-bold uppercase text-sm text-text-primary">
                    <span>Water Safety</span>
                    <span className="text-critical">40%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-critical transition-all"
                      style={{ width: '40%' }}
                    ></div>
                  </div>
                </div>

                {/* Shelter Capacity */}
                <div>
                  <div className="flex justify-between mb-md font-bold uppercase text-sm text-text-primary">
                    <span>Shelter Capacity</span>
                    <span className="text-info">92%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-info transition-all"
                      style={{ width: '92%' }}
                    ></div>
                  </div>
                </div>
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
                <li className="flex items-center justify-between pb-md border-b border-critical/30">
                  <span className="font-semibold text-sm text-text-primary">Drinking Water</span>
                  <span className="text-xs font-bold bg-critical text-white px-md py-xs rounded-card">
                    Critical
                  </span>
                </li>
                <li className="flex items-center justify-between pb-md border-b border-critical/30">
                  <span className="font-semibold text-sm text-text-primary">Dry Rations</span>
                  <span className="text-xs font-bold bg-warning text-white px-md py-xs rounded-card">
                    High
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">Clothing</span>
                  <span className="text-xs font-bold bg-safe text-white px-md py-xs rounded-card">
                    Met
                  </span>
                </li>
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
                <li>
                  <p className="font-bold text-text-primary">Crisis Hotline</p>
                  <p className="text-xs text-text-secondary">+94-11-2-345-678</p>
                </li>
                <li>
                  <p className="font-bold text-text-primary">Medical Support</p>
                  <p className="text-xs text-text-secondary">Red Cross Centers</p>
                </li>
                <li>
                  <p className="font-bold text-text-primary">Counseling Services</p>
                  <p className="text-xs text-text-secondary">Disaster Relief Desk</p>
                </li>
              </ul>
            </UnifiedCard>
          </div>
        </div>

        {/* Recent Updates */}
        <div>
          <h3 className="text-lg font-bold uppercase mb-lg text-text-primary">Recent Updates</h3>
          <div className="bg-bg-card border border-border-light p-lg rounded-card shadow-md space-y-md">
            <div className="flex items-start gap-lg pb-md border-b border-border-light">
              <CheckCircle size={20} className="text-safe shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="font-bold text-sm text-text-primary">Routes restored to Sector 4</p>
                <p className="text-xs text-text-secondary">Today at 14:30</p>
              </div>
            </div>
            <div className="flex items-start gap-lg pb-md border-b border-border-light">
              <Truck size={20} className="text-info shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="font-bold text-sm text-text-primary">Relief supplies distributed to 500 families</p>
                <p className="text-xs text-text-secondary">Yesterday at 11:00</p>
              </div>
            </div>
            <div className="flex items-start gap-lg">
              <Hammer size={20} className="text-warning shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="font-bold text-sm text-text-primary">Reconstruction work begins at damaged homes</p>
                <p className="text-xs text-text-secondary">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}