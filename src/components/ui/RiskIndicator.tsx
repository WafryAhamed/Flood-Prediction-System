import React from 'react';

interface RiskIndicatorProps {
  level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE';
  className?: string;
}

export function RiskIndicator({
  level,
  className = ''
}: RiskIndicatorProps) {
  const getConfig = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-critical',
          text: 'text-white',
          label: 'CRITICAL RISK',
          border: 'border-critical'
        };
      case 'HIGH':
        return {
          bg: 'bg-warning',
          text: 'text-black',
          label: 'HIGH RISK',
          border: 'border-warning'
        };
      case 'MODERATE':
        return {
          bg: 'bg-caution',
          text: 'text-black',
          label: 'MODERATE RISK',
          border: 'border-caution'
        };
      case 'LOW':
        return {
          bg: 'bg-safe',
          text: 'text-white',
          label: 'LOW RISK',
          border: 'border-safe'
        };
      case 'SAFE':
        return {
          bg: 'bg-white',
          text: 'text-safe',
          border: 'border-safe',
          label: 'AREA SAFE'
        };
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-white',
          label: 'UNKNOWN',
          border: 'border-gray-600'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`
        ${config.bg} ${config.text} border-4 border-dark-text
        px-card py-section flex items-center justify-center text-center shadow-medium
      `}>
        <h2 className="text-display-lg font-black uppercase tracking-tight leading-none">
          {config.label}
        </h2>
      </div>
    </div>
  );
}