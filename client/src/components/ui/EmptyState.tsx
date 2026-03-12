import React from 'react';
import { Inbox, Map, FileText, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'inbox' | 'map' | 'file' | 'chart';
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  inbox: Inbox,
  map: Map,
  file: FileText,
  chart: BarChart3,
};

export function EmptyState({
  icon = 'inbox',
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {emoji ? (
        <span className="text-5xl mb-4" role="img" aria-hidden="true">
          {emoji}
        </span>
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-6 py-2.5 bg-info text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors min-h-[48px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
