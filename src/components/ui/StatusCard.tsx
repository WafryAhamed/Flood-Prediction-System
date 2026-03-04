import React from 'react';
import { motion } from 'framer-motion';

interface StatusCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  accentColor?: 'critical' | 'warning' | 'caution' | 'safe' | 'neutral';
  delay?: number;
}

export function StatusCard({
  children,
  title,
  className = '',
  accentColor = 'neutral',
  delay = 0
}: StatusCardProps) {
  const getLeftBorderClass = () => {
    if (accentColor === 'neutral') return '';
    switch (accentColor) {
      case 'critical':
        return 'border-l-4 border-l-critical';
      case 'warning':
        return 'border-l-4 border-l-warning';
      case 'caution':
        return 'border-l-4 border-l-caution';
      case 'safe':
        return 'border-l-4 border-l-safe';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: 'easeOut'
      }}
      className={`bg-bg-card border border-border-light rounded-card shadow-card flex flex-col overflow-hidden ${getLeftBorderClass()} ${className}`}
    >
      {title && (
        <div className="px-inner py-inner border-b border-border-light">
          <h3 className="text-base font-semibold text-text-primary">
            {title}
          </h3>
        </div>
      )}
      <div className={`${title ? 'p-inner' : 'p-inner'} flex-1`}>
        {children}
      </div>
    </motion.div>
  );
}