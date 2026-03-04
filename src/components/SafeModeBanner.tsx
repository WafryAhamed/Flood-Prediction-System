import React, { useState } from 'react';
import { AlertTriangle, X, Shield, MapPin, Phone } from 'lucide-react';

interface SafeModeBannerProps {
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export function SafeModeBanner({ riskLevel = 'CRITICAL' }: SafeModeBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (riskLevel !== 'CRITICAL' || dismissed) return null;

  return (
    <div
      className="bg-red-600 text-white shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      {/* Main banner */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle size={20} className="shrink-0 animate-pulse" />
          <span className="font-bold text-sm truncate">
            ⚠ Flood warning active in your area
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold uppercase bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            {expanded ? 'Hide' : 'Safety Tips'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss warning"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Expanded safe actions */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/20 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
              <Shield size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs uppercase">Stay Safe</div>
                <p className="text-xs opacity-90 mt-0.5">Move to higher ground immediately. Avoid flooded roads.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs uppercase">Find Shelter</div>
                <p className="text-xs opacity-90 mt-0.5">Check the Risk Map for nearby safe zones and shelters.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
              <Phone size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs uppercase">Call for Help</div>
                <p className="text-xs opacity-90 mt-0.5">Use the emergency button to reach rescue services.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
