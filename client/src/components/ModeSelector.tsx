import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, AlertOctagon, RefreshCw } from 'lucide-react';
type Mode = 'NORMAL' | 'WATCH' | 'EMERGENCY' | 'RECOVERY';
export function ModeSelector() {
  const [mode, setMode] = useState<Mode>('NORMAL');
  const modes = [{
    id: 'NORMAL',
    label: 'Normal',
    icon: Shield,
    color: 'bg-[#00CC00]',
    text: 'text-white'
  }, {
    id: 'WATCH',
    label: 'Watch',
    icon: Eye,
    color: 'bg-[#FFCC00]',
    text: 'text-black'
  }, {
    id: 'EMERGENCY',
    label: 'Emergency',
    icon: AlertOctagon,
    color: 'bg-[#FF0000]',
    text: 'text-white'
  }, {
    id: 'RECOVERY',
    label: 'Recovery',
    icon: RefreshCw,
    color: 'bg-[#0000FF]',
    text: 'text-white'
  }];
  return <div className="fixed top-20 right-4 z-30 md:top-6 md:right-6">
      <div className="flex flex-col items-end gap-2">
        <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-1">
          System Mode
        </span>
        <div className="flex bg-white border-4 border-black p-1 gap-1">
          {modes.map(m => <button key={m.id} onClick={() => setMode(m.id as Mode)} className={`
                p-2 flex flex-col items-center justify-center w-16 h-16 transition-all
                ${mode === m.id ? `${m.color} ${m.text} border-2 border-black` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
              `}>
              <m.icon size={20} strokeWidth={3} />
              <span className="text-[8px] font-black uppercase mt-1">
                {m.label}
              </span>
            </button>)}
        </div>
      </div>
    </div>;
}