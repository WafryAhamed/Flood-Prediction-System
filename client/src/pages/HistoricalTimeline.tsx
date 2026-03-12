import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { TrendingUp, AlertOctagon, Calendar } from 'lucide-react';

const data = [
  { year: '2018', floods: 2, rainfall: 1200 },
  { year: '2019', floods: 1, rainfall: 900 },
  { year: '2020', floods: 3, rainfall: 1500 },
  { year: '2021', floods: 4, rainfall: 1800 },
  { year: '2022', floods: 2, rainfall: 1100 },
  { year: '2023', floods: 5, rainfall: 2100 },
];

export function HistoricalTimeline() {
  const [selectedDistrict, setSelectedDistrict] = useState('Colombo District');

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
            <option>Colombo District</option>
            <option>Gampaha District</option>
            <option>Kalutara District</option>
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
            <p className="text-5xl font-bold mb-md">17</p>
            <p className="text-xs font-semibold opacity-90">Last 5 Years</p>
          </UnifiedCard>

          {/* Peak Month Card */}
          <UnifiedCard>
            <div className="flex items-start justify-between mb-lg">
              <h3 className="font-bold uppercase text-sm text-text-primary">Peak Month</h3>
              <Calendar size={22} strokeWidth={2} className="text-text-primary" />
            </div>
            <p className="text-5xl font-bold mb-md text-text-primary">MAY</p>
            <p className="text-xs font-semibold text-text-secondary">Monsoon Season</p>
          </UnifiedCard>

          {/* Risk Trend Card */}
          <UnifiedCard accentColor="warning">
            <div className="flex items-start justify-between mb-lg">
              <h3 className="font-bold uppercase text-sm text-text-primary">Risk Trend</h3>
              <TrendingUp size={22} strokeWidth={2} className="text-orange-500" />
            </div>
            <p className="text-5xl font-bold mb-md text-orange-500">+15%</p>
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
              <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
              { year: 2023, events: 5, description: 'Severe monsoon rainfall caused widespread flooding in urban areas' },
              { year: 2022, events: 2, description: 'Two localized flood events in coastal regions' },
              { year: 2021, events: 4, description: 'Increased frequency due to climate variability' },
              { year: 2020, events: 3, description: 'Recovery phase with moderate flood incidents' }
            ].map((item, idx) => (
              <div key={idx} className="bg-bg-card border border-border-light p-lg rounded-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-md">
                  <span className="font-bold text-lg text-text-primary">{item.year}</span>
                  <span className="inline-block bg-critical/10 text-critical text-xs font-bold px-md py-xs rounded-card">
                    {item.events} Event{item.events !== 1 ? 's' : ''}
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