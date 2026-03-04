import React, { useState } from 'react';
import { HelpCircle, X, MapPin, AlertTriangle, Phone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickHelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  const helpItems = [
    {
      icon: MapPin,
      title: 'Find safe zones',
      description: 'Open the Risk Map to see safe areas, shelters, and evacuation routes near you.',
      link: '/map',
    },
    {
      icon: AlertTriangle,
      title: 'Report flooding',
      description: 'Go to the Report page to submit a flood report and help your community stay informed.',
      link: '/report',
    },
    {
      icon: Phone,
      title: 'Emergency numbers',
      description: 'Tap the red emergency button (bottom-right) to call rescue services instantly.',
      link: null,
    },
  ];

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-24 md:left-auto md:right-6 md:bottom-[160px] z-40 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg flex items-center justify-center text-text-secondary hover:text-info transition-all"
        aria-label="Quick help guide"
      >
        <HelpCircle size={20} />
      </button>

      {/* Help panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 flex items-end md:items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <HelpCircle size={20} className="text-info" />
                  <h3 className="font-bold text-text-primary">Quick Help</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Close help"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Help items */}
              <div className="p-4 space-y-3">
                {helpItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-text-primary flex items-center gap-1">
                        {item.title}
                        {item.link && <ChevronRight size={14} className="text-text-secondary" />}
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-semibold text-info hover:text-blue-700 transition-colors"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
