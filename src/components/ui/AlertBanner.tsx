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
        return 'bg-critical text-white';
      case 'warning':
        return 'bg-warning text-black';
      default:
        return 'bg-black text-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{
            duration: 0.3,
            ease: 'easeOut'
          }}
          className={`
            fixed top-0 left-0 right-0 z-50 
            ${getColors()} 
            border-b-3 border-dark-text
            px-card py-inner-lg shadow-medium
          `}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-inner-lg">
            <div className="flex items-center gap-2 md:gap-inner-lg min-w-0">
              <AlertTriangle size={20} strokeWidth={2.5} className="shrink-0 md:w-6 md:h-6" />
              <p className="text-sm md:text-lg font-black uppercase tracking-tight truncate">
                {message}
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-inner hover:opacity-70 transition-opacity shrink-0"
              aria-label="Close alert"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}