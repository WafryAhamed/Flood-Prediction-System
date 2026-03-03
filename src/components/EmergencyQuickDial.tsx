import React from 'react';
import { Phone, Ambulance } from 'lucide-react';
export function EmergencyQuickDial() {
  return <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-auto">
      {/* Secondary emergency action (ambulance) */}
      <button className="w-14 h-14 bg-white border-4 border-black text-[#FF0000] flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform" aria-label="Call Ambulance">
        <Ambulance size={24} strokeWidth={3} />
      </button>
      
      {/* Primary emergency action - large, prominent */}
      <button className="w-16 h-16 bg-[#FF0000] border-4 border-black text-white flex items-center justify-center rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform animate-pulse" aria-label="Emergency Call 911">
        <Phone size={32} strokeWidth={3} />
      </button>
    </div>;
}