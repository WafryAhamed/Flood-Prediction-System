import React from 'react';
import { FactorContribution } from '../services/mlApi';

export const RiskLevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-600 text-white animate-pulse',
    HIGH: 'bg-orange-500 text-white',
    MODERATE: 'bg-yellow-400 text-gray-900',
    LOW: 'bg-green-400 text-white',
    MINIMAL: 'bg-blue-400 text-white',
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gray-600 font-semibold">Risk Level:</span>
      <span className={`px-4 py-1 rounded-full font-bold text-sm shadow ${colors[level] || 'bg-gray-400 text-white'}`}>
        {level}
      </span>
    </div>
  );
};

export const ProbabilityGauge: React.FC<{ value: number }> = ({ value }) => {
  const percentage = Math.round(value * 100);
  
  // Color scale
  let color = 'text-green-500';
  if (value > 0.8) color = 'text-red-600';
  else if (value > 0.5) color = 'text-orange-500';
  else if (value > 0.3) color = 'text-yellow-500';

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Flood Probability</h4>
      <div className="flex items-center gap-4">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${color.replace('text-', 'bg-')}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className={`font-bold ${color}`}>{percentage}%</span>
      </div>
    </div>
  );
};

export const RiskFactorsList: React.FC<{ factors: FactorContribution[] }> = ({ factors }) => {
  if (!factors || factors.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Top Risk Factors</h4>
      <ul className="space-y-2">
        {factors.map((factor, idx) => (
          <li key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
            <span className="font-medium text-gray-700 capitalize">
              {factor.feature.replace(/_/g, ' ')}
            </span>
            <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs">
              {(factor.contribution * 100).toFixed(1)}% weight
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const RecommendationsList: React.FC<{ items: string[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Recommended Actions</h4>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
