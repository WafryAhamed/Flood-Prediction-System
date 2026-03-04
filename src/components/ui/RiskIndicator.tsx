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
          bg: 'bg-red-600',
          text: 'text-white',
          label: 'CRITICAL RISK',
          border: 'border-red-600',
          weight: 'font-bold'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          label: 'HIGH RISK',
          border: 'border-orange-500',
          weight: ''
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500',
          text: 'text-black',
          label: 'MODERATE RISK',
          border: 'border-amber-500',
          weight: ''
        };
      case 'LOW':
        return {
          bg: 'bg-green-600',
          text: 'text-white',
          label: 'LOW RISK',
          border: 'border-green-600',
          weight: ''
        };
      case 'SAFE':
        return {
          bg: 'bg-white',
          text: 'text-green-600',
          border: 'border-green-600',
          label: 'AREA SAFE',
          weight: ''
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

  const animationClass = level === 'CRITICAL'
    ? 'animate-warning-flash'
    : level === 'HIGH'
      ? 'animate-warning-slow'
      : '';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`
        ${config.bg} ${config.text} ${config.weight} border-4 border-dark-text
        px-card py-section flex items-center justify-center text-center shadow-medium
        ${animationClass}
      `}>
        <h2 className="text-display-lg font-black uppercase tracking-tight leading-none">
          {config.label}
        </h2>
      </div>
    </div>
  );
}