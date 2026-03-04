import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmergencyButtonProps {
  label: string;
  icon: LucideIcon;
  variant: 'critical' | 'warning' | 'caution' | 'safe';
  onClick?: () => void;
  className?: string;
}

export function EmergencyButton({
  label,
  icon: Icon,
  variant,
  onClick,
  className = ''
}: EmergencyButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'bg-critical text-white hover:bg-opacity-90';
      case 'warning':
        return 'bg-warning text-black hover:bg-opacity-90';
      case 'caution':
        return 'bg-caution text-black hover:bg-opacity-90';
      case 'safe':
        return 'bg-safe text-white hover:bg-opacity-90';
      default:
        return 'bg-black text-white';
    }
  };

  const isCritical = variant === 'critical';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={isCritical ? {
        scale: [1, 1.03, 1]
      } : {}}
      transition={isCritical ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      } : {
        duration: 0.15
      }}
      className={`
        relative w-full min-h-24 flex flex-col items-center justify-center 
        border-3 border-dark-text px-inner-lg py-inner-lg gap-2
        font-black uppercase rounded transition-all
        ${getVariantStyles()}
        ${isCritical ? 'shadow-elevation' : 'shadow-medium'}
        ${className}
      `}
    >
      <Icon size={32} strokeWidth={2.5} />
      <span className="text-base font-black uppercase tracking-wide text-center leading-tight">
        {label}
      </span>
    </motion.button>
  );
}