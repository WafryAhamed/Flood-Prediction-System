import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Minimize2, Maximize2, X, Zap } from 'lucide-react';

interface Message {
  id: string;
  type: 'admin' | 'system';
  text: string;
  timestamp: Date;
  action?: string;
}

export function AdminAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      text: 'Hello! I\'m your AI assistant. I can help with district management, alert analysis, and crisis response coordination.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated AI responses for different command types
  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'admin',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let responseText = '';
    let action = undefined;

    // Simple command parsing
    if (input.toLowerCase().includes('alert')) {
      responseText = 'Broadcasting emergency alert to all districts. 2,847 users notified. Status: ✓ Delivered';
      action = 'broadcast-alert';
    } else if (input.toLowerCase().includes('report')) {
      responseText = 'Generating crisis report for affected areas. 156 critical locations identified. Generating PDF...';
      action = 'generate-report';
    } else if (input.toLowerCase().includes('risk')) {
      responseText = 'Risk analysis complete. 4 districts at critical level. 12 at high. Recommendations: Activate shelters, Deploy resources to Zone A.';
      action = 'risk-analysis';
    } else if (input.toLowerCase().includes('coordin')) {
      responseText = 'Coordinating with 23 emergency responders. Current deployment: 89% of resources allocated. Response time: 2.3 minutes average.';
      action = 'coordination';
    } else if (input.toLowerCase().includes('model')) {
      responseText = 'Running flood prediction models. Current scenario: Heavy rainfall + upstream dam release. Peak flood: 2 hours 14 minutes. Affected population: ~45,000.';
      action = 'model-run';
    } else {
      responseText = `Processing your request. You asked about: "${input}". How can I assist further? Try commands like: alert, report, risk, coordin, or model.`;
    }

    const systemMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      text: responseText,
      timestamp: new Date(),
      action,
    };

    setMessages((prev) => [...prev, systemMessage]);
    setIsLoading(false);
  }, [input]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-40"
        title="Admin AI Assistant"
      >
        <Zap size={24} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`fixed bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-300 ${
          isExpanded ? 'w-screen h-screen inset-0' : 'bottom-8 right-8 w-96 h-128'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap size={20} />
            <h3 className="font-bold text-16px">AI Crisis Commander</h3>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.1 }}
              className="p-2 hover:bg-purple-700 rounded transition-colors"
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </motion.button>
            <motion.button
              onClick={() => setIsOpen(false)}
              whileHover={{ scale: 1.1 }}
              className="p-2 hover:bg-purple-700 rounded transition-colors"
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  message.type === 'admin'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-300 rounded-bl-none'
                }`}
              >
                <p className="text-14px leading-relaxed">{message.text}</p>
                {message.action && (
                  <div className="mt-2 pt-2 border-t border-purple-500/30 flex gap-2">
                    <button className="text-11px px-2 py-1 bg-purple-500/30 rounded hover:bg-purple-500/50 transition-colors">
                      Execute
                    </button>
                    <span className="text-11px text-purple-100">{message.action}</span>
                  </div>
                )}
                <span className="text-11px opacity-75 block mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-lg border border-gray-300 rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-gray-200 grid grid-cols-2 gap-2">
          <button className="text-12px px-2 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors font-medium">
            📊 Risk Analysis
          </button>
          <button className="text-12px px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors font-medium">
            🚨 Send Alert
          </button>
          <button className="text-12px px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors font-medium">
            📋 Generate Report
          </button>
          <button className="text-12px px-2 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors font-medium">
            🎯 Coordination
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about alerts, reports, risk analysis, models..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-14px"
            rows={2}
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
          </motion.button>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 bg-purple-50 border-t border-purple-200 text-11px text-purple-600 rounded-b-lg">
          <p>💡 Try: "alert", "report", "risk analysis", "coordination", or "model"</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AdminAIAssistant;
