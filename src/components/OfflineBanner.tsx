import React, { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setIsOffline(true); setDismissed(false); };
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-semibold shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff size={18} className="shrink-0" />
      <span>Offline mode active. Emergency tools still available.</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 p-1 hover:bg-white/20 rounded transition-colors shrink-0"
        aria-label="Dismiss offline notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
