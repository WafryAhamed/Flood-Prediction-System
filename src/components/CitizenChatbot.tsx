import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, MapPin, Camera, AlertTriangle, Home } from 'lucide-react';
export function CitizenChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: 'Hello! I am your flood safety assistant. How can I help you today?',
    time: 'now'
  }]);
  const quickActions = [{
    icon: AlertTriangle,
    label: 'Am I in danger?',
    action: 'danger'
  }, {
    icon: MapPin,
    label: 'Nearest safe place',
    action: 'safe-place'
  }, {
    icon: Camera,
    label: 'Report flooding',
    action: 'report'
  }, {
    icon: Home,
    label: 'Protect my home',
    action: 'protect'
  }];
  return <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 bg-[#0066FF] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform border-4 border-white" aria-label="Open Safety Assistant">
        <MessageCircle size={28} strokeWidth={2.5} />
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
      }} className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-white border-4 border-black shadow-2xl flex flex-col" style={{
        height: '600px',
        maxHeight: 'calc(100vh - 8rem)'
      }}>
            {/* Header */}
            <div className="bg-[#0066FF] p-4 border-b-4 border-black flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white" />
                <h3 className="text-white font-black uppercase text-sm">
                  Safety Assistant
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {messages.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 ${msg.role === 'user' ? 'bg-[#0066FF] text-white rounded-tl-xl rounded-bl-xl rounded-tr-xl' : 'bg-white border-2 border-black rounded-br-xl rounded-bl-xl rounded-tr-xl'}`}>
                    <p className="font-bold text-sm leading-relaxed">
                      {msg.text}
                    </p>
                    <span className="text-[10px] opacity-60 mt-1 block">
                      {msg.time}
                    </span>
                  </div>
                </div>)}
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-white border-t-2 border-gray-200">
              <p className="text-xs font-bold uppercase text-gray-500 mb-3">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => <button key={i} className="flex items-center gap-2 p-3 border-2 border-black hover:bg-gray-100 transition-colors">
                    <action.icon size={16} />
                    <span className="font-bold text-xs">{action.label}</span>
                  </button>)}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t-4 border-black">
              <div className="relative">
                <input type="text" placeholder="Type your question..." className="w-full border-2 border-black px-4 py-3 pr-12 focus:outline-none focus:border-[#0066FF] font-bold" />
                <button className="absolute right-2 top-2 bg-[#0066FF] text-white p-2 hover:bg-[#0052CC]">
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 font-bold mt-2 text-center">
                Available in සිංහල • தமிழ் • English
              </p>
            </div>
          </motion.div>}
      </AnimatePresence>
    </>;
}