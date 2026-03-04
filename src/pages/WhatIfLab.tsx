import React, { useState } from 'react';
import { Sliders, RefreshCw, X } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { RiskIndicator } from '../components/ui/RiskIndicator';
import { motion, AnimatePresence } from 'framer-motion';

export function WhatIfLab() {
  const [params, setParams] = useState({
    rainfall: 50,
    drainage: 50,
    urbanization: 50
  });
  const [showControls, setShowControls] = useState(false);

  const riskLevel =
    params.rainfall > 80 && params.drainage < 40
      ? 'CRITICAL'
      : params.rainfall > 60
      ? 'HIGH'
      : params.rainfall > 40
      ? 'MODERATE'
      : 'LOW';

  const handleReset = () => {
    setParams({
      rainfall: 50,
      drainage: 50,
      urbanization: 50
    });
  };

  return (
    <div className="min-h-screen px-lg px-lg md:px-xl pb-xl bg-bg-primary">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-xl">
        <div className="inline-block bg-info text-white px-lg py-sm font-bold text-xs uppercase tracking-widest mb-md rounded-card">
          Simulation Mode
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight text-text-primary">
            What-If Lab
          </h1>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-md font-bold uppercase text-sm text-critical hover:opacity-70 transition-opacity w-full md:w-auto px-lg py-md"
          >
            <RefreshCw size={18} /> Reset Defaults
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-xl">
        {/* Controls Panel - Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <UnifiedCard noPadding className="sticky top-lg w-full">
            <div className="p-lg border-b border-border-light">
              <h3 className="font-bold uppercase text-sm flex items-center gap-md text-text-primary">
                <Sliders strokeWidth={2} size={18} /> Variables
              </h3>
            </div>

            <div className="p-lg space-y-lg">
              {/* Rainfall Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">
                    Rainfall
                  </label>
                  <span className="font-mono font-bold text-xs text-text-secondary">
                    {params.rainfall}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.rainfall}
                  onChange={e =>
                    setParams({
                      ...params,
                      rainfall: parseInt(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-critical"
                  style={{
                    background: `linear-gradient(to right, #E63946 0%, #E63946 ${params.rainfall}%, #e5e7eb ${params.rainfall}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Drainage Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">
                    Drainage
                  </label>
                  <span className="font-mono font-bold text-xs text-text-secondary">
                    {params.drainage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.drainage}
                  onChange={e =>
                    setParams({
                      ...params,
                      drainage: parseInt(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-safe"
                  style={{
                    background: `linear-gradient(to right, #2ECC71 0%, #2ECC71 ${params.drainage}%, #e5e7eb ${params.drainage}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Urban Density Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">
                    Urban Density
                  </label>
                  <span className="font-mono font-bold text-xs text-text-secondary">
                    {params.urbanization}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.urbanization}
                  onChange={e =>
                    setParams({
                      ...params,
                      urbanization: parseInt(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-info"
                  style={{
                    background: `linear-gradient(to right, #3A86FF 0%, #3A86FF ${params.urbanization}%, #e5e7eb ${params.urbanization}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Model Info */}
              <div className="mt-lg pt-lg border-t border-border-light">
                <p className="text-xs font-semibold text-text-secondary uppercase">
                  AI Model: Surrogate-v2.1
                </p>
                <p className="text-xs font-semibold text-safe mt-xs">
                  Confidence: 94%
                </p>
              </div>
            </div>
          </UnifiedCard>
        </div>

        {/* Results Area - Center Stage */}
        <div className="lg:col-span-3 flex flex-col gap-xl">
          {/* Risk Indicator */}
          <div className="flex justify-center">
            <RiskIndicator level={riskLevel} />
          </div>

          {/* Impact Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Projected Impact */}
            <div className="bg-bg-card border border-border-light p-lg rounded-card shadow-md">
              <h4 className="font-bold uppercase text-sm mb-lg text-text-primary">
                Projected Impact
              </h4>
              <ul className="space-y-lg">
                <li className="flex justify-between items-center pb-lg border-b border-border-light">
                  <span className="font-semibold text-sm text-text-secondary">
                    Households Affected
                  </span>
                  <span className="font-mono font-bold text-2xl text-critical">
                    {Math.round((params.rainfall * params.urbanization) / 10)}
                  </span>
                </li>
                <li className="flex justify-between items-center pb-lg border-b border-border-light">
                  <span className="font-semibold text-sm text-text-secondary">
                    Roads Submerged
                  </span>
                  <span className="font-mono font-bold text-2xl text-warning">
                    {Math.round(params.rainfall / 5)} km
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-text-secondary">
                    Economic Loss
                  </span>
                  <span className="font-mono font-bold text-2xl text-critical">
                    ${Math.round(params.rainfall * params.urbanization * 100)}k
                  </span>
                </li>
              </ul>
            </div>

            {/* Mitigation Advice */}
            <div className={`${
              params.drainage < 30
                ? 'bg-critical text-white'
                : 'bg-safe text-white'
            } p-lg rounded-card shadow-md`}>
              <h4 className="font-bold uppercase text-sm mb-lg">
                Mitigation Advice
              </h4>
              <p className="font-semibold leading-relaxed text-sm">
                {params.drainage < 30
                  ? '⚠️ URGENT: Drainage capacity is insufficient for this rainfall level. Immediate clearing required.'
                  : '✓ Current infrastructure can handle this load, but monitor low-lying areas.'}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-bg-card border border-border-light p-lg rounded-card shadow-md">
            <h4 className="font-bold uppercase text-sm mb-lg text-text-primary">
              Scenario Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-md">
              <div className="text-center p-md bg-bg-primary rounded-card border border-border-light">
                <p className="text-xs font-semibold text-text-secondary uppercase mb-md">Input Rainfall</p>
                <p className="text-2xl font-bold text-critical">{params.rainfall}%</p>
              </div>
              <div className="text-center p-md bg-bg-primary rounded-card border border-border-light">
                <p className="text-xs font-semibold text-text-secondary uppercase mb-md">Drainage Capacity</p>
                <p className={`text-2xl font-bold ${params.drainage > 70 ? 'text-safe' : 'text-warning'}`}>
                  {params.drainage}%
                </p>
              </div>
              <div className="text-center p-md bg-bg-primary rounded-card border border-border-light">
                <p className="text-xs font-semibold text-text-secondary uppercase mb-md">Urban Impact Factor</p>
                <p className="text-2xl font-bold text-info">{params.urbanization}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls Button */}
      <button
        onClick={() => setShowControls(true)}
        className="lg:hidden fixed bottom-lg right-lg z-20 bg-critical text-white p-md rounded-full shadow-lg hover:opacity-90 transition-opacity"
        title="Open controls"
      >
        <Sliders size={24} strokeWidth={2} />
      </button>

      {/* Mobile Controls Sheet */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-card border-t border-border-light rounded-t-2xl max-h-96 overflow-y-auto"
          >
            <div className="p-lg space-y-lg">
              <div className="flex justify-between items-center mb-lg border-b border-border-light pb-lg">
                <h3 className="font-bold uppercase text-sm text-text-primary">
                  Variables
                </h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Rainfall Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">Rainfall</label>
                  <span className="font-mono font-bold text-xs text-text-secondary">{params.rainfall}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.rainfall}
                  onChange={e => setParams({ ...params, rainfall: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Drainage Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">Drainage</label>
                  <span className="font-mono font-bold text-xs text-text-secondary">{params.drainage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.drainage}
                  onChange={e => setParams({ ...params, drainage: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Urban Density Slider */}
              <div>
                <div className="flex justify-between mb-md">
                  <label className="font-bold uppercase text-xs text-text-primary">Urban Density</label>
                  <span className="font-mono font-bold text-xs text-text-secondary">{params.urbanization}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.urbanization}
                  onChange={e => setParams({ ...params, urbanization: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  handleReset();
                  setShowControls(false);
                }}
                className="w-full flex items-center justify-center gap-md bg-bg-primary text-text-primary font-bold uppercase text-sm py-md rounded-card hover:bg-gray-100 transition-colors mt-lg"
              >
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}