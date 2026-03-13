import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { TrendingUp, AlertOctagon, Calendar } from 'lucide-react';
import { useMaintenanceStore } from '../stores/maintenanceStore';

export function HistoricalTimeline() {
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const historyData = useMaintenanceStore((s) => s.historyData);
  const mapZones = useMaintenanceStore((s) => s.mapZones);

  const districtOptions = useMemo(() => {
    const derived = Array.from(new Set(mapZones.map((zone) => zone.name.split(',')[0].trim()).filter(Boolean)));
    return ['All Districts', ...derived];
  }, [mapZones]);

  const sortedHistory = useMemo(
    () => [...historyData].sort((a, b) => a.year - b.year),
    [historyData],
  );

  const filteredHistory = useMemo(() => {
    if (selectedDistrict === 'All Districts') return sortedHistory;
    const token = selectedDistrict.split(' ')[0].toLowerCase();
    const matched = sortedHistory.filter((item) => item.description.toLowerCase().includes(token));
    return matched.length > 0 ? matched : sortedHistory;
  }, [selectedDistrict, sortedHistory]);

  const chartData = useMemo(
    () => filteredHistory.map((item) => ({ year: String(item.year), floods: item.floods, rainfall: item.rainfall })),
    [filteredHistory],
  );

  const totalEvents = useMemo(
    () => filteredHistory.reduce((sum, item) => sum + item.floods, 0),
    [filteredHistory],
  );

  const peakEntry = useMemo(
    () => filteredHistory.reduce((best, current) => (current.floods > best.floods ? current : best), filteredHistory[0] || { year: 0, floods: 0, rainfall: 0, description: '' }),
    [filteredHistory],
  );

  const riskTrend = useMemo(() => {
    if (filteredHistory.length < 2) return 0;
    const first = filteredHistory[0].floods || 1;
    const last = filteredHistory[filteredHistory.length - 1].floods;
    return Math.round(((last - first) / first) * 100);
  }, [filteredHistory]);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 pb-xl bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-xl">
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary mb-lg">
            Flood History
          </h1>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="border border-border-light px-lg py-md font-semibold uppercase bg-bg-card text-text-primary text-sm rounded-card focus:outline-none focus:border-critical transition-colors"
          >
            {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </header>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
          {/* Total Events Card */}
          <UnifiedCard className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none">
            <div className="flex items-start justify-between mb-lg">
              <h3 className="font-bold uppercase text-sm">Total Events</h3>
              <AlertOctagon size={22} strokeWidth={2} />
            </div>
            <p className="text-5xl font-bold mb-md">{totalEvents}</p>
            <p className="text-xs font-semibold opacity-90">Last 5 Years</p>
          </UnifiedCard>

          {/* Peak Month Card */}
          <UnifiedCard>
            <div className="flex items-start justify-between mb-lg">
              <h3 className="font-bold uppercase text-sm text-text-primary">Peak Month</h3>
              <Calendar size={22} strokeWidth={2} className="text-text-primary" />
            </div>
            <p className="text-5xl font-bold mb-md text-text-primary">{peakEntry.year || '—'}</p>
            <p className="text-xs font-semibold text-text-secondary">Highest annual flood count</p>
          </UnifiedCard>

          {/* Risk Trend Card */}
          <UnifiedCard accentColor="warning">
            <div className="flex items-start justify-between mb-lg">
              <h3 className="font-bold uppercase text-sm text-text-primary">Risk Trend</h3>
              <TrendingUp size={22} strokeWidth={2} className="text-orange-500" />
            </div>
            <p className="text-5xl font-bold mb-md text-orange-500">{riskTrend >= 0 ? '+' : ''}{riskTrend}%</p>
            <p className="text-xs font-semibold text-text-secondary">Year over Year</p>
          </UnifiedCard>
        </div>

        {/* Chart Container */}
        <UnifiedCard>
          <h3 className="font-bold uppercase text-sm mb-lg text-text-primary">
            Annual Flood Frequency
          </h3>
          <div className="h-64 md:h-80 lg:h-96 -mx-lg -mb-lg px-lg pb-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    fill: '#5F6B7A'
                  }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    fill: '#5F6B7A'
                  }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#1E1E1E'
                  }}
                  labelStyle={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#1E1E1E'
                  }}
                />
                <Bar dataKey="floods" fill="#E63946" name="Floods" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rainfall" fill="#FFD60A" name="Rainfall (mm)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </UnifiedCard>

        {/* Historical Events List */}
        <div className="mt-xl">
          <h3 className="font-bold uppercase text-sm text-text-primary mb-lg">Recent Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {[
              ...[...filteredHistory].sort((a, b) => b.year - a.year).slice(0, 4)
            ].map((item) => (
              <div key={item.id} className="bg-bg-card border border-border-light p-lg rounded-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-md">
                  <span className="font-bold text-lg text-text-primary">{item.year}</span>
                  <span className="inline-block bg-critical/10 text-critical text-xs font-bold px-md py-xs rounded-card">
                    {item.floods} Event{item.floods !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs font-semibold text-text-secondary leading-snug">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}