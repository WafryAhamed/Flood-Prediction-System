import React, { useState } from 'react';
import { MoreVertical, Ban, Trash2, CheckCircle } from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';

interface AdminActionMenuProps {
  userId: string;
}

export function AdminActionMenu({ userId }: AdminActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const suspendUser = useMaintenanceStore((s) => s.suspendUser);
  const activateUser = useMaintenanceStore((s) => s.activateUser);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-700 rounded transition-colors"
        title="Actions"
      >
        <MoreVertical size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20">
          <button
            onClick={() => {
              activateUser(userId);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-600 transition-colors text-sm text-gray-300 first:rounded-t last:rounded-b"
          >
            <CheckCircle size={16} className="text-green-400" />
            Activate
          </button>
          <button
            onClick={() => {
              suspendUser(userId);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-600 transition-colors text-sm text-gray-300 border-t border-gray-600"
          >
            <Ban size={16} className="text-orange-400" />
            Suspend
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-600 transition-colors text-sm text-gray-300 border-t border-gray-600 rounded-b"
            onClick={() => setIsOpen(false)}
          >
            <Trash2 size={16} className="text-red-400" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
