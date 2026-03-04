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
        return 'bg-red-600 text-white font-bold';
      case 'warning':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-blue-600 text-white';
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
              {/* Animated siren indicator */}
              <span className="relative flex shrink-0">
                <span className="animate-siren inline-flex">
                  <AlertTriangle size={20} strokeWidth={2.5} className="shrink-0 md:w-6 md:h-6" />
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-live-dot" />
              </span>
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