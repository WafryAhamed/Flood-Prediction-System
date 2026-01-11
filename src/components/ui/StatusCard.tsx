import React from 'react';
import { motion } from 'framer-motion';
interface StatusCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  accentColor?: 'red' | 'orange' | 'yellow' | 'green' | 'black';
  delay?: number;
}
export function StatusCard({
  children,
  title,
  className = '',
  accentColor = 'black',
  delay = 0
}: StatusCardProps) {
  const getAccentClass = () => {
    switch (accentColor) {
      case 'red':
        return 'bg-[#FF0000]';
      case 'orange':
        return 'bg-[#FF6600]';
      case 'yellow':
        return 'bg-[#FFCC00]';
      case 'green':
        return 'bg-[#00CC00]';
      default:
        return 'bg-black';
    }
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay,
    ease: 'linear'
  }} className={`relative bg-white border-4 border-black flex flex-col ${className}`}>
      {title && <div className={`p-3 border-b-4 border-black flex justify-between items-center ${getAccentClass()}`}>
          <h3 className={`text-xl uppercase font-black tracking-tight ${accentColor === 'yellow' || accentColor === 'green' ? 'text-black' : 'text-white'}`}>
            {title}
          </h3>
          <div className="h-3 w-3 bg-white border-2 border-black"></div>
        </div>}
      <div className="p-4 flex-1">{children}</div>
    </motion.div>;
}