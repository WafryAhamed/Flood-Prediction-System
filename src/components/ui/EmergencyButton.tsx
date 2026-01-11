import React from 'react';
import { motion } from 'framer-motion';
import { BoxIcon } from 'lucide-react';
interface EmergencyButtonProps {
  label: string;
  icon: BoxIcon;
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
        // Red
        return 'bg-[#FF0000] text-white hover:bg-[#D00000]';
      case 'warning':
        // Orange
        return 'bg-[#FF6600] text-black hover:bg-[#E05500]';
      case 'caution':
        // Yellow
        return 'bg-[#FFCC00] text-black hover:bg-[#E6B800]';
      case 'safe':
        // Green
        return 'bg-[#00CC00] text-white hover:bg-[#00AA00]';
      default:
        return 'bg-black text-white';
    }
  };
  const isCritical = variant === 'critical';
  return <motion.button onClick={onClick} whileHover={{
    scale: 1.02
  }} whileTap={{
    scale: 0.98
  }} animate={isCritical ? {
    scale: [1, 1.02, 1]
  } : {}} transition={isCritical ? {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear'
  } : {
    duration: 0.1
  }} className={`
        relative w-full min-h-[100px] flex flex-col items-center justify-center 
        border-4 border-black p-4 gap-3
        ${getVariantStyles()}
        ${className}
      `}>
      <Icon size={36} strokeWidth={3} />
      <span className="text-xl font-black uppercase tracking-wide text-center leading-tight">
        {label}
      </span>

      {/* Decorative corner markers */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
    </motion.button>;
}