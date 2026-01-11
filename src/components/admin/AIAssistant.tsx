import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  return <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 bg-[#00E5FF] text-black p-4 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105 transition-transform">
        <Bot size={24} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: 20,
        scale: 0.9
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 20,
        scale: 0.9
      }} className="fixed bottom-24 right-6 z-50 w-96 bg-[#132F4C] border border-[#00E5FF] shadow-2xl overflow-hidden flex flex-col" style={{
        height: '500px'
      }}>
            {/* Header */}
            <div className="bg-[#0A1929] p-4 border-b border-[#1E4976] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#00E5FF]" />
                <h3 className="text-[#00E5FF] font-bold uppercase tracking-wider text-sm">
                  Ops AI Assistant
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono-cmd text-sm">
              <div className="bg-[#0A1929] p-3 rounded-br-xl rounded-bl-xl rounded-tr-xl border border-[#1E4976] text-gray-300">
                <p>
                  System operational. I am monitoring 14 active data streams.
                </p>
                <p className="mt-2 text-[#FFC107]">
                  ⚠ Anomaly detected in Gampaha District: Water levels rising
                  faster than predicted model.
                </p>
              </div>

              <div className="bg-[#00E5FF]/10 p-3 rounded-tl-xl rounded-bl-xl rounded-tr-xl border border-[#00E5FF]/30 text-[#00E5FF] ml-auto max-w-[80%]">
                <p>Show me critical infrastructure at risk in Gampaha.</p>
              </div>

              <div className="bg-[#0A1929] p-3 rounded-br-xl rounded-bl-xl rounded-tr-xl border border-[#1E4976] text-gray-300">
                <p>Analyzing Gampaha District...</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    <span className="text-[#FF1744]">CRITICAL:</span> Kelani
                    Bridge (Structure ID: B-402)
                  </li>
                  <li>
                    <span className="text-[#FFC107]">WARNING:</span> Base
                    Hospital Gampaha (Access Road)
                  </li>
                  <li>
                    <span className="text-[#FFC107]">WARNING:</span> Substation
                    4 (Power)
                  </li>
                </ul>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0A1929] border-t border-[#1E4976]">
              <div className="relative">
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask command AI..." className="w-full bg-[#132F4C] border border-[#1E4976] text-white px-4 py-2 pr-10 focus:outline-none focus:border-[#00E5FF] font-mono-cmd text-sm" />
                <button className="absolute right-2 top-2 text-[#00E5FF] hover:text-white">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </>;
}