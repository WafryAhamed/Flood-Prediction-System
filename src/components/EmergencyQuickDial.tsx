import React from 'react';
import { Phone, Ambulance, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmergencyQuickDial() {
  const [isOpen, setIsOpen] = React.useState(false);

  const secondaryActions = [
    {
      icon: Ambulance,
      label: 'Ambulance',
      color: 'bg-warning',
      onClick: () => console.log('Calling Ambulance...')
    },
    {
      icon: HelpCircle,
      label: 'Get Help',
      color: 'bg-info',
      onClick: () => console.log('Opening Help...')
    }
  ];

  return (
    <div className="fixed bottom-xl md:bottom-lg right-lg z-[10000] md:mb-20 flex flex-col items-end gap-md pointer-events-auto">
      {/* Secondary Actions - Above Primary */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-md items-end"
          >
            {secondaryActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={i}
                  onClick={action.onClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-14 h-14 ${action.color} text-white
                    flex items-center justify-center rounded-card
                    border border-border-light shadow-card
                    hover:opacity-90 transition-opacity
                  `}
                  title={action.label}
                  aria-label={action.label}
                >
                  <Icon size={22} strokeWidth={2} />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Emergency Action - Always Visible */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: [1, 1.08, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="
          w-16 h-16 bg-critical text-white
          flex items-center justify-center rounded-card
          border border-border-light shadow-lg
          hover:opacity-90 transition-opacity
        "
        aria-label="Emergency Call 911"
      >
        <Phone size={28} strokeWidth={2} />
      </motion.button>
    </div>
  );
}