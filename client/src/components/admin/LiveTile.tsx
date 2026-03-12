import React from 'react';
import { motion } from 'framer-motion';
interface LiveTileProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: 'cyan' | 'amber' | 'red' | 'green';
  pulsing?: boolean;
  className?: string;
}
export function LiveTile({
  label,
  value,
  trend,
  trendUp,
  color = 'cyan',
  pulsing = false,
  className = ''
}: LiveTileProps) {
  const colors = {
    cyan: 'text-[#00E5FF] border-[#00E5FF]',
    amber: 'text-[#FFC107] border-[#FFC107]',
    red: 'text-[#FF1744] border-[#FF1744]',
    green: 'text-[#00E676] border-[#00E676]'
  };
  return <div className={`bg-[#132F4C] border border-[#1E4976] p-4 relative overflow-hidden ${className}`}>
      {pulsing && <motion.div animate={{
      opacity: [0.2, 0.5, 0.2]
    }} transition={{
      duration: 2,
      repeat: Infinity
    }} className={`absolute inset-0 bg-${color}-500/10 pointer-events-none`} />}

      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">
          {label}
        </span>
        {pulsing && <motion.div animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1]
      }} transition={{
        duration: 1.5,
        repeat: Infinity
      }} className={`w-2 h-2 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} style={{
        backgroundColor: color === 'cyan' ? '#00E5FF' : color === 'red' ? '#FF1744' : color === 'amber' ? '#FFC107' : '#00E676'
      }} />}
      </div>

      <div className={`text-3xl font-bold font-mono-cmd ${colors[color].split(' ')[0]}`}>
        {value}
      </div>

      {trend && <div className={`text-xs font-mono-cmd mt-1 ${trendUp ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </div>}
    </div>;
}