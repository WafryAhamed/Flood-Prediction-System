import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Maximize2, X, Trash2, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'admin' | 'system';
  text: string;
  timestamp: Date;
  action?: string;
}

const QUICK_ACTIONS = [
  { label: '📊 Risk Analysis', command: 'Run risk analysis for all districts' },
  { label: '🚨 Send Alert', command: 'Send emergency alert to all districts' },
  { label: '📋 Generate Report', command: 'Generate crisis report' },
  { label: '🎯 Coordination', command: 'Show coordination status' },
  { label: '🤖 Run Model', command: 'Run flood prediction model' },
  { label: '📈 Status', command: 'Show current system status overview' },
];

const INITIAL_MESSAGE: Message = {
  id: '1',
  type: 'system',
  text: "Hello Commander! I'm your AI Crisis Assistant. I can help with district management, alert analysis, flood prediction models, and crisis response coordination.\n\nUse the quick actions below or type a command.",
  timestamp: new Date(),
};

function processInput(text: string): { responseText: string; action?: string } {
  const lower = text.toLowerCase();
  if (lower.includes('alert')) {
    return {
      responseText: 'Broadcasting emergency alert to all districts. 2,847 users notified. Status: ✓ Delivered',
      action: 'broadcast-alert',
    };
  }
  if (lower.includes('report')) {
    return {
      responseText: 'Generating crisis report for affected areas. 156 critical locations identified. Generating PDF...',
      action: 'generate-report',
    };
  }
  if (lower.includes('risk')) {
    return {
      responseText: 'Risk analysis complete. 4 districts at critical level. 12 at high. Recommendations: Activate shelters, Deploy resources to Zone A.',
      action: 'risk-analysis',
    };
  }
  if (lower.includes('coordin')) {
    return {
      responseText: 'Coordinating with 23 emergency responders. Current deployment: 89% of resources allocated. Response time: 2.3 minutes average.',
      action: 'coordination',
    };
  }
  if (lower.includes('model') || lower.includes('predict')) {
    return {
      responseText: 'Running flood prediction models. Current scenario: Heavy rainfall + upstream dam release. Peak flood: 2 hours 14 minutes. Affected population: ~45,000.',
      action: 'model-run',
    };
  }
  if (lower.includes('status') || lower.includes('overview')) {
    return {
      responseText: 'System Status: ✅ Operational\n• Active alerts: 3\n• Districts monitored: 25\n• Evacuees: 8,200\n• Resources deployed: 89%\n• Avg response time: 2.3 min',
      action: 'status-check',
    };
  }
  return {
    responseText: `I received your message: "${text}"\n\nI can help with:\n• Risk analysis — type "risk"\n• Alert broadcasting — type "alert"\n• Crisis reports — type "report"\n• Coordination — type "coordination"\n• Flood models — type "model"\n• System status — type "status"`,
  };
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    let focusTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isOpen) {
      focusTimeout = setTimeout(() => inputRef.current?.focus(), 200);
    }
    return () => {
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'admin',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const { responseText, action } = processInput(text);

    const systemMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      text: responseText,
      timestamp: new Date(),
      action,
    };

    setMessages((prev) => [...prev, systemMessage]);
    setIsLoading(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const handleQuickAction = (command: string) => {
    sendMessage(command);
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all z-40 group"
        title="Open AI Crisis Assistant"
      >
        <div className="relative">
          <Bot size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse" />
        </div>
        <span className="font-semibold text-sm tracking-wide">AI Assistant</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`fixed z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-gray-700 ${
          isExpanded
            ? 'inset-4 sm:inset-8'
            : 'bottom-6 right-6 w-[420px] h-[560px]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">AI Crisis Commander</h3>
              <span className="text-[10px] text-blue-200 font-medium tracking-wide uppercase">Online • Ready</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/15 rounded-lg transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              className="p-2 hover:bg-white/15 rounded-lg transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  message.type === 'admin'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                {message.action && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-white/15 rounded-full font-medium uppercase tracking-wide">
                      {message.action}
                    </span>
                  </div>
                )}
                <span className="text-[10px] opacity-60 block mt-1.5">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-xl border border-gray-700 rounded-bl-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-2 border-t border-gray-700 bg-gray-850 bg-gray-800 flex gap-2 overflow-x-auto shrink-0 scrollbar-thin">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.command}
              onClick={() => handleQuickAction(qa.command)}
              disabled={isLoading}
              className="whitespace-nowrap text-xs px-3 py-1.5 bg-gray-700 text-gray-200 rounded-full hover:bg-blue-600 hover:text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-700 bg-gray-800 flex gap-2 items-end shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or ask a question..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none text-sm text-gray-100 placeholder-gray-400"
            rows={1}
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            title="Send message"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIAssistant;
