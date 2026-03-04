import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SystemLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export function SystemLogo({ size = 'md', variant = 'dark', showText = true, className = '' }: SystemLogoProps) {
  const sizeMap = {
    sm: { icon: 18, text: 'text-sm' },
    md: { icon: 24, text: 'text-lg' },
    lg: { icon: 36, text: 'text-2xl' },
  };

  const colorMap = {
    light: 'text-white',
    dark: 'text-text-primary',
  };

  const s = sizeMap[size];
  const color = colorMap[variant];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <ShieldAlert size={s.icon} className={`${color}`} strokeWidth={2.2} />
        {/* Water wave accent */}
        <svg
          width={s.icon * 0.5}
          height={s.icon * 0.3}
          viewBox="0 0 12 8"
          className="absolute -bottom-0.5 -right-1"
          fill="none"
        >
          <path
            d="M0 4C2 2 4 6 6 4C8 2 10 6 12 4"
            stroke={variant === 'light' ? '#93C5FD' : '#3B82F6'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${s.text} ${color} leading-tight`}>
          Flood Resilience
        </span>
      )}
    </div>
  );
}
