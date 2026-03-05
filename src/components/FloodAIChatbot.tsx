import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageCircle, X, Loader, AlertTriangle, MapPin, Home, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'qwen/qwen3-vl-30b-a3b-thinking';
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `You are a flood emergency assistant for Sri Lanka.
Give short, clear responses.
Focus only on: flood safety, evacuation, shelters, weather risk, emergency help.
Do not give long explanations. Maximum 3 sentences.
If question unrelated to floods, politely say you only assist with flood emergencies.
Key numbers — DMC: 1999, Police: 119, Ambulance: 1990.`;

const QUICK_ACTIONS = [
  { icon: AlertTriangle, label: 'Am I in danger?', prompt: 'Am I in danger right now? What should I do?' },
  { icon: MapPin, label: 'Nearest shelter', prompt: 'Where is the nearest safe shelter near Mihintale, Sri Lanka?' },
  { icon: Home, label: 'Protect my home', prompt: 'How do I protect my home from flooding?' },
  { icon: ShieldCheck, label: 'Emergency numbers', prompt: 'What are the emergency hotline numbers in Sri Lanka for floods?' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function FloodAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hi! I'm your flood safety assistant for Sri Lanka. Ask me about flood safety, evacuation, shelters, or weather risks.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll ---------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* Focus input when panel opens ----------------------------------- */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  /* Build API payload (last N messages) ---------------------------- */
  const buildApiMessages = useCallback(
    (userText: string): ApiMessage[] => {
      const history: ApiMessage[] = messages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));
      return [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userText }];
    },
    [messages],
  );

  /* Send message --------------------------------------------------- */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-(MAX_HISTORY - 1)), userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('API key missing');

        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Flood Resilience System',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: buildApiMessages(trimmed),
            max_tokens: 1024,
            temperature: 0.4,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('OpenRouter error:', res.status, errBody);
          throw new Error(`API ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        console.log('OpenRouter response:', JSON.stringify(data).slice(0, 300));

        let rawReply =
          data.choices?.[0]?.message?.content??
          data.choices?.[0]?.text ??
          '';
        // Strip <think>…</think> blocks produced by thinking models
        rawReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const reply = rawReply || 'Sorry, I could not generate a response. Please try again.';

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev.slice(-(MAX_HISTORY - 1)), aiMsg]);
      } catch (err) {
        console.error('Chatbot API error:', err);
        setError('AI assistant temporarily unavailable. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, buildApiMessages],
  );

  /* Key handler ---------------------------------------------------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* Format time ---------------------------------------------------- */
  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <>
      {/* ---- Floating toggle button ---- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          aria-label="Open Flood Safety Chat"
        >
          <MessageCircle size={24} strokeWidth={2} />
        </button>
      )}

      {/* ---- Chat panel ---- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={[
              'fixed z-[9999] flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden',
              'inset-0',
              'md:inset-auto md:bottom-24 md:right-6 md:w-96 md:max-w-[calc(100vw-3rem)]',
            ].join(' ')}
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-white" />
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">Flood Safety Assistant</h3>
                  <p className="text-blue-200 text-[10px]">AI-powered &bull; Sri Lanka</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-xl rounded-br-sm'
                        : 'bg-gray-200 text-gray-900 rounded-xl rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="block text-[10px] opacity-50 mt-1 text-right">{fmtTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl rounded-bl-sm flex items-center gap-2 text-sm">
                    <Loader size={14} className="animate-spin" />
                    AI is thinking&hellip;
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
                    {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions (only when few messages) */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 py-2 bg-white border-t border-gray-100 shrink-0">
                <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Quick questions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg transition-colors text-left"
                    >
                      <qa.icon size={14} className="shrink-0" />
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder={isLoading ? 'Waiting for response...' : 'Ask about flood safety...'}
                  className="flex-1 min-h-[48px] px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="min-h-[48px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center justify-center"
                  aria-label="Send message"
                >
                  {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
