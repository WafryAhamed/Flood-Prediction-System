import React from 'react';
import { Phone, Ambulance, ShieldAlert } from 'lucide-react';
export function EmergencyQuickDial() {
  return <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-3 md:bottom-8 md:right-8">
      <button className="w-14 h-14 bg-[#FF0000] border-4 border-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all">
        <Phone size={24} strokeWidth={3} />
      </button>
      <button className="w-14 h-14 bg-white border-4 border-black text-[#FF0000] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all">
        <Ambulance size={24} strokeWidth={3} />
      </button>
    </div>;
}