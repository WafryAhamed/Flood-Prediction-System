import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
interface AlertBannerProps {
  message: string;
  type?: 'danger' | 'warning' | 'info';
}
export function AlertBanner({
  message,
  type = 'danger'
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const getColors = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#FF0000] text-white';
      case 'warning':
        return 'bg-[#FF6600] text-black';
      default:
        return 'bg-black text-white';
    }
  };
  return <AnimatePresence>
      {isVisible && <motion.div initial={{
      y: -100
    }} animate={{
      y: 0
    }} exit={{
      y: -100
    }} transition={{
      duration: 0.3,
      ease: 'circOut'
    }} className={`
            fixed top-0 left-0 right-0 z-50 
            ${getColors()} 
            border-b-4 border-black
            p-4 shadow-none
          `}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-black text-white p-1 border-2 border-white">
                <AlertTriangle size={24} strokeWidth={3} />
              </div>
              <p className="text-lg md:text-xl font-black uppercase tracking-wide">
                {message}
              </p>
            </div>
            <button onClick={() => setIsVisible(false)} className="p-2 border-2 border-current hover:bg-black hover:text-white transition-colors">
              <X size={24} strokeWidth={3} />
            </button>
          </div>
        </motion.div>}
    </AnimatePresence>;
}