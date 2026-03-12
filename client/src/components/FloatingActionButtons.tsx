import { useState } from 'react';
import { AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onAccessibilityClick?: () => void;
  inlineOnly?: boolean;
}

export function FloatingActionButtons({
  onAccessibilityClick,
  inlineOnly
}: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);

  if (inlineOnly) {
    return (
      <button
        onClick={onAccessibilityClick}
        aria-label="Accessibility Options"
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
      >
        <Volume2 size={28} strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-28 right-6 md:bottom-8 md:right-8 z-30 flex flex-col gap-3">
      <AnimatePresence>
        {expanded && null}
      </AnimatePresence>

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