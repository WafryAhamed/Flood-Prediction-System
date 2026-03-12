import React from 'react';

interface LoadingSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Height of each skeleton card */
  height?: string;
  /** Layout variant */
  variant?: 'card' | 'list' | 'map' | 'metric';
  className?: string;
}

export function LoadingSkeleton({ count = 3, height = 'h-32', variant = 'card', className = '' }: LoadingSkeletonProps) {
  if (variant === 'map') {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg w-full h-[400px] flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm font-medium">Loading map...</div>
      </div>
    );
  }

  if (variant === 'metric') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-md ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-4 border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-full mb-3" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-lg ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-white rounded-lg border border-gray-100 overflow-hidden`}>
          <div className={`bg-gray-200 ${height}`} />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
