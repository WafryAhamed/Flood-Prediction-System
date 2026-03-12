import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageCircle, X, Loader, AlertTriangle, MapPin, Home, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import type { ChatbotKnowledgeEntry } from '../types/admin';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */
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

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FALLBACK_MODELS = [
  'qwen/qwen3-vl-30b-a3b-thinking',
  'google/gemma-3-1b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'openai/gpt-4o-mini',
];
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `You are the Flood Safety Assistant for Sri Lanka. Help citizens during floods and heavy rainfall.

STRICT RULES:
- Only answer questions about floods, rain, evacuation, shelters, safety, or weather in Sri Lanka.
- Maximum 3 sentences per response. Keep answers short, clear, and practical.
- If a user asks something unrelated, reply exactly: "I can only assist with flood safety and emergency information in Sri Lanka."

EMERGENCY CONTACTS:
Emergency Hotline: 112 | Police: 119 | Ambulance/Fire: 110 | Disaster Management Centre (DMC): 117

FLOOD SAFETY:
- Move to higher ground immediately if water levels rise.
- Avoid walking or driving through floodwater.
- Stay away from rivers, canals, and drainage during heavy rain.
- Follow DMC instructions.

EVACUATION:
- Follow evacuation notices from local authorities.
- Move to nearest safe shelter (schools, temples, government buildings, designated relief shelters).
- Carry documents, drinking water, medicine, and a flashlight.

HIGH-RISK DISTRICTS: Colombo, Gampaha, Kalutara, Ratnapura, Matara, Galle, Anuradhapura, Batticaloa.

MONSOON SEASONS: Southwest Monsoon (May–September), Northeast Monsoon (December–February). Flood risk highest during these periods.

FLOOD WARNING SIGNS: rapidly rising river water, continuous heavy rainfall, blocked drainage, landslides in hill areas.

Always prioritize safety. Never give long explanations. Keep answers simple and direct.`;

const QUICK_ACTIONS = [
  { icon: AlertTriangle, label: 'Am I in danger?', prompt: 'Am I in danger right now? What should I do?' },
  { icon: MapPin, label: 'Nearest shelter', prompt: 'Where is the nearest safe shelter near Mihintale, Sri Lanka?' },
  { icon: Home, label: 'Protect my home', prompt: 'How do I protect my home from flooding?' },
  { icon: ShieldCheck, label: 'Emergency numbers', prompt: 'What are the emergency hotline numbers in Sri Lanka for floods?' },
];

/* ================================================================== */
/*  Local fallback response engine                                     */
/*  Used when the API key is invalid / network fails / quota exceeded  */
/* ================================================================== */
function getLocalResponse(userText: string, adminKnowledge?: ChatbotKnowledgeEntry[]): string {
  const q = userText.toLowerCase();

  // Check admin-managed knowledge entries first
  if (adminKnowledge) {
    for (const entry of adminKnowledge) {
      if (!entry.active) continue;
      if (entry.keywords.some((kw) => q.includes(kw.toLowerCase()))) {
        return entry.response;
      }
    }
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|ayubowan)/i.test(q)) {
    return "Hello! I'm your flood safety assistant for Sri Lanka. How can I help you today? Ask me about flood safety, evacuation, shelters, or emergency contacts.";
  }

  // Danger / risk
  if (q.includes('danger') || q.includes('risk') || q.includes('safe') || q.includes('am i')) {
    return 'If water levels are rising near you, move to higher ground immediately. Avoid flooded roads and stay away from rivers. Call the Disaster Management Centre at 117 for live updates.';
  }

  // Emergency numbers
  if (q.includes('emergency') || q.includes('number') || q.includes('hotline') || q.includes('call') || q.includes('phone') || q.includes('contact')) {
    return 'Emergency Hotline: 112 | Police: 119 | Ambulance/Fire: 110 | Disaster Management Centre (DMC): 117. Call 117 for flood-specific assistance.';
  }

  // Shelter
  if (q.includes('shelter') || q.includes('safe place') || q.includes('safe zone') || q.includes('relief') || q.includes('refuge')) {
    return 'Head to the nearest school, temple, or government building designated as a relief shelter. Follow evacuation signs and local authority directions. Carry water, medicine, and important documents.';
  }

  // Evacuation
  if (q.includes('evacuat') || q.includes('leave') || q.includes('move') || q.includes('escape') || q.includes('route')) {
    return 'Follow evacuation notices from local authorities. Move to higher ground or the nearest designated shelter. Carry essential documents, drinking water, medicine, and a flashlight.';
  }

  // Weather / rain / monsoon
  if (q.includes('weather') || q.includes('rain') || q.includes('monsoon') || q.includes('forecast') || q.includes('storm')) {
    return "Sri Lanka's southwest monsoon runs May–September and the northeast monsoon December–February. Flood risk is highest during these periods. Monitor the DMC (117) and local weather reports closely.";
  }

  // Home protection
  if (q.includes('home') || q.includes('house') || q.includes('protect') || q.includes('sandbag') || q.includes('property')) {
    return 'Place sandbags around entry points and move valuables to upper floors. Turn off electricity if water enters your home. Seal ground-level doors and windows with plastic sheeting.';
  }

  // Flood areas / districts
  if (q.includes('area') || q.includes('district') || q.includes('prone') || q.includes('colombo') || q.includes('ratnapura') || q.includes('kalutara') || q.includes('galle') || q.includes('matara') || q.includes('batticaloa')) {
    return 'High-risk flood districts include Colombo, Gampaha, Kalutara, Ratnapura, Matara, Galle, Anuradhapura, and Batticaloa. Residents in low-lying areas should monitor warnings closely.';
  }

  // Warning signs
  if (q.includes('warning') || q.includes('sign') || q.includes('alert') || q.includes('landslide')) {
    return 'Watch for: rapidly rising river water levels, continuous heavy rainfall, blocked drainage systems, and landslides in hilly areas. If you observe these, move to safety immediately.';
  }

  // What to do
  if (q.includes('what should') || q.includes('what do') || q.includes('help') || q.includes('guide') || q.includes('advice') || q.includes('tip')) {
    return 'Move to higher ground if water rises. Avoid walking or driving through floodwater. Keep emergency numbers handy — DMC: 117, Police: 119, Emergency: 112.';
  }

  // Agriculture / farm
  if (q.includes('farm') || q.includes('crop') || q.includes('agriculture') || q.includes('livestock') || q.includes('field')) {
    return 'Move livestock and seeds to higher ground immediately. Drain excess water from fields if possible. Document crop losses for insurance claims and contact your agricultural extension officer.';
  }

  // Default flood-related response
  return 'I can help with flood safety, evacuation routes, shelters, emergency numbers, and weather risks in Sri Lanka. What would you like to know? Call 117 (DMC) for immediate assistance.';
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export function FloodAIChatbot() {
  const chatbotKnowledge = useMaintenanceStore((s) => s.chatbotKnowledge);
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
      const activeKnowledge = chatbotKnowledge
        .filter((k) => k.active)
        .map((k) => `${k.category}: ${k.response}`)
        .join('\n');
      const enhancedPrompt = activeKnowledge
        ? `${SYSTEM_PROMPT}\n\nADDITIONAL KNOWLEDGE (admin-managed):\n${activeKnowledge}`
        : SYSTEM_PROMPT;
      return [{ role: 'system', content: enhancedPrompt }, ...history, { role: 'user', content: userText }];
    },
    [messages, chatbotKnowledge],
  );

  /* Try OpenRouter API with fallback models ------------------------ */
  const callOpenRouter = async (userText: string): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('VITE_OPENROUTER_API_KEY not set — using local responses.');
      return null;
    }

    const apiMessages = buildApiMessages(userText);

    for (const model of FALLBACK_MODELS) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Flood Resilience System',
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            max_tokens: 1024,
            temperature: 0.4,
          }),
        });

        if (res.status === 401) {
          // Auth failure — key is invalid, no point trying other models
          const errBody = await res.text();
          console.error(`OpenRouter 401 (invalid key): ${errBody}`);
          return null;
        }

        if (!res.ok) {
          const errBody = await res.text();
          console.warn(`OpenRouter ${res.status} with model ${model}:`, errBody);
          continue; // try the next model
        }

        const data = await res.json();
        console.log('OpenRouter OK:', model, JSON.stringify(data).slice(0, 200));

        let rawReply =
          data.choices?.[0]?.message?.content ??
          data.choices?.[0]?.text ??
          '';

        // Strip <think>…</think> blocks produced by thinking models
        rawReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        if (rawReply) return rawReply;
        // Empty response — try next model
      } catch (networkErr) {
        console.warn(`Network error with model ${model}:`, networkErr);
        continue;
      }
    }

    return null; // all models failed
  };

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
        // 1️⃣ Try OpenRouter API
        const aiReply = await callOpenRouter(trimmed);

        // 2️⃣ Use reply or fall back to local engine
        const finalReply = aiReply || getLocalResponse(trimmed, chatbotKnowledge);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev.slice(-(MAX_HISTORY - 1)), aiMsg]);
      } catch (err) {
        console.error('Chatbot error:', err);
        // Even the fallback failed — still show a helpful message
        const fallbackMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getLocalResponse(trimmed, chatbotKnowledge),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev.slice(-(MAX_HISTORY - 1)), fallbackMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
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
