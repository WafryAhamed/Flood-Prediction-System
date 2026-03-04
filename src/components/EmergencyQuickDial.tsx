import React from 'react';
import { Phone } from 'lucide-react';

export function EmergencyQuickDial() {
  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
  };

  return (
    <button
      onClick={handleEmergencyCall}
      className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      aria-label="Emergency Call"
    >
      <Phone size={28} strokeWidth={2} />
    </button>
  );
}