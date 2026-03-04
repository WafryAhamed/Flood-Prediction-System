import React, { useEffect, useState } from 'react';
import { SystemLogo } from './SystemLogo';

export function AppLoader({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparing emergency system...');

  useEffect(() => {
    const steps = [
      { at: 20, text: 'Loading safety data...' },
      { at: 50, text: 'Initializing flood maps...' },
      { at: 75, text: 'Connecting to alert system...' },
      { at: 95, text: 'Almost ready...' },
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 300);
          return 100;
        }
        const step = steps.find(s => prev < s.at && next >= s.at);
        if (step) setStatusText(step.text);
        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        {/* Logo */}
        <div className="animate-pulse">
          <SystemLogo size="lg" variant="dark" />
        </div>

        {/* App name */}
        <p className="text-sm font-medium text-text-secondary tracking-wide">
          {statusText}
        </p>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-info rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Spinner */}
        <div className="mt-2">
          <svg
            className="animate-spin h-5 w-5 text-info"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
