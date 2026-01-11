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
          bg: 'bg-[#FF0000]',
          text: 'text-white',
          label: 'CRITICAL RISK'
        };
      case 'HIGH':
        return {
          bg: 'bg-[#FF6600]',
          text: 'text-black',
          label: 'HIGH RISK'
        };
      case 'MODERATE':
        return {
          bg: 'bg-[#FFCC00]',
          text: 'text-black',
          label: 'MODERATE RISK'
        };
      case 'LOW':
        return {
          bg: 'bg-[#00CC00]',
          text: 'text-white',
          label: 'LOW RISK'
        };
      case 'SAFE':
        return {
          bg: 'bg-white',
          text: 'text-[#00CC00]',
          border: 'border-[#00CC00]',
          label: 'AREA SAFE'
        };
      default:
        return {
          bg: 'bg-black',
          text: 'text-white',
          label: 'UNKNOWN'
        };
    }
  };
  const config = getConfig();
  const borderClass = config.border ? `border-4 ${config.border}` : 'border-4 border-black';
  return <div className={`flex flex-col ${className}`}>
      <div className={`
        ${config.bg} ${config.text} ${borderClass}
        p-6 flex items-center justify-center text-center
      `}>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
          {config.label}
        </h2>
      </div>
      <div className="bg-black text-white p-2 text-center font-bold text-sm uppercase tracking-widest">
        Current Status
      </div>
    </div>;
}