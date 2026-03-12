import React from 'react';
import { Phone } from 'lucide-react';
import { useMaintenanceStore } from '../stores/maintenanceStore';

export function EmergencyQuickDial() {
  const contacts = useMaintenanceStore((s) => s.emergencyContacts);
  const activeContact = contacts.find((c) => c.active);
  const emergencyNumber = activeContact?.number || '112';

  const handleEmergencyCall = () => {
    window.location.href = `tel:${emergencyNumber}`;
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