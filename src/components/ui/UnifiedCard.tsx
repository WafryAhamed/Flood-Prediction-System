import React from 'react';
import { motion } from 'framer-motion';

interface UnifiedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  accentColor?: 'critical' | 'warning' | 'caution' | 'safe' | 'info' | 'neutral';
  delay?: number;
  interactive?: boolean;
  onClick?: () => void;
  noPadding?: boolean;
}

export function UnifiedCard({
  children,
  title,
  subtitle,
  className = '',
  accentColor = 'neutral',
  delay = 0,
  interactive = false,
  onClick,
  noPadding = false
}: UnifiedCardProps) {
  const getAccentClass = () => {
    switch (accentColor) {
      case 'critical':
        return 'border-l-4 border-l-red-600';
      case 'warning':
        return 'border-l-4 border-l-orange-500';
      case 'caution':
        return 'border-l-4 border-l-yellow-400';
      case 'safe':
        return 'border-l-4 border-l-green-600';
      case 'info':
        return 'border-l-4 border-l-blue-600';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        bg-bg-card border border-border-light rounded-xl shadow-md
        ${getAccentClass()}
        ${noPadding ? '' : 'p-6'}
        ${interactive ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all' : ''}
        overflow-hidden
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4 pb-4 border-b border-border-light">
          {title && <h3 className="text-lg font-bold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
