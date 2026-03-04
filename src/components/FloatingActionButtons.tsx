import React, { useState } from 'react';
import { AlertCircle, Volume2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onSOSClick?: () => void;
  onAccessibilityClick?: () => void;
  onChatClick?: () => void;
}

export function FloatingActionButtons({
  onSOSClick,
  onAccessibilityClick,
  onChatClick
}: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);

  const buttons = [
    {
      icon: AlertCircle,
      label: 'SOS',
      color: 'bg-red-600 hover:bg-red-700',
      onClick: onSOSClick,
      ariaLabel: 'Emergency SOS Alert'
    },
    {
      icon: Volume2,
      label: 'Accessibility',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: onAccessibilityClick,
      ariaLabel: 'Accessibility Options'
    },
    {
      icon: MessageCircle,
      label: 'Chat',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      onClick: onChatClick,
      ariaLabel: 'AI Chat Assistant'
    }
  ];

  return (
    <div className="fixed bottom-28 right-6 md:bottom-8 md:right-8 z-30 flex flex-col gap-3">
      <AnimatePresence>
        {expanded && (
          <>
            {buttons.map((button, index) => (
              <motion.div
                key={button.label}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.button
                  onClick={() => {
                    button.onClick?.();
                    setExpanded(false);
                  }}
                  aria-label={button.ariaLabel}
                  className={`w-14 h-14 rounded-full ${button.color} text-white shadow-lg transition-all flex items-center justify-center`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button.icon size={24} strokeWidth={2} />
                </motion.button>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Toggle */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle action menu"
        aria-expanded={expanded}
      >
        <motion.div
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle size={28} strokeWidth={2} />
        </motion.div>
      </motion.button>
    </div>
  );
}
