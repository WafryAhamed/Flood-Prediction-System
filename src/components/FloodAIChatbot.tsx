import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, MessageCircle, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  voiceReady?: boolean;
}

interface ChatbotProps {
  userProfile?: {
    location?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    homeType?: string;
    livelihood?: string;
  };
  language?: 'en' | 'si' | 'ta';
  isOpen?: boolean;
  onClose?: () => void;
}

export function FloodAIChatbot({
  userProfile = {},
  language = 'en',
  isOpen: initialOpen = false,
  onClose,
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      text: language === 'en' 
        ? '👋 Hi! I\'m your flood safety assistant. How can I help you today?'
        : language === 'si'
        ? '👋 ඔබ සුවසම්මතයි! මම ඔබගේ flood ඉතා උපකරණ සහාය। අද මට සොයා ගත හැකි දැයි?'
        : '👋 வணக்கம்! நான் உங்கள் வெள்ளப் பாதுகாப்பு உதவியாளி. இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();

    // Emergency questions
    if (lower.includes('am i in danger') || lower.includes('is it safe')) {
      const riskLevel = userProfile.riskLevel || 'unknown';
      if (language === 'en') {
        return `Based on your location (${userProfile.location || 'current area'}), your current risk level is ${riskLevel}. If you're in immediate danger, call 1999 (DMC) or 119 (Police) now. Would you like evacuation guidance?`;
      }
      if (language === 'si') {
        return `ඔබගේ ස්ථානය (${userProfile.location || 'වර්තමාන ප්‍රදේශ'}) වලට අනුව, ඔබගේ වර්තමාන අවදානම මට්ටම ${riskLevel} ය. ඔබ ක්ષණික අවදානමට ඇතිනම්, දැන්වე 1999 (DMC) හෝ 119 (පොලිස්) ඇමතිනු ඇත. ඉවත් කිරීමේ මඟ දැක්වීමක් අවශ්‍ය දැයි?`;
      }
      return `உங்கள் இடத்தின் (${userProfile.location || 'தற்போதைய பகுதி'}) அடிப்படையில், உங்கள் தற்போதைய ஆபத்து நிலை ${riskLevel} ஆகும். நீங்கள் உடனடி ஆபத்தில் இருந்தால், இப்போது 1999 (DMC) அல்லது 119 (பொலிசு) அழைக்கவும்.`;
    }

    // What to do now
    if (
      lower.includes('what should i do') ||
      lower.includes('help me') ||
      lower.includes('guide me')
    ) {
      if (language === 'en') {
        return `Here's what you should do now:\n1. Charge your phone immediately\n2. Gather important documents in a waterproof bag\n3. Inform family members of your location\n4. Keep emergency numbers handy (DMC: 1999, Police: 119)\n5. Move valuable items to higher places\n\nDo you need help with a specific task?`;
      }
      if (language === 'si') {
        return `ඔබ දැන් කළ යුතු දේ:\n1. ඔබගේ දුරකතන තුරන්තුවෙන් චාර්ජ කරන්න\n2. වැදගත් ឯකාthompulur් ජල පසු බැඳුම් පිසියෙ එකතු කරන්න\n3. පරිවාර සদස්‍ය ඔබගේ ස්ථානය දැනුම් දෙන්න\n4. জরुरी අංකවල (DMC: 1999, පොලිස්: 119) අතේ තබා ගන්න\n5. වටිනා දේ ඉහල ස්ථාගවට ගෙන යන්න`;
      }
      return `உங்கள் செய்ய வேண்டிய செயல்கள்:\n1. உங்கள் ஃபோனை உடனடியாக சார்ஜ் செய்யுங்கள்\n2. முக்கிய ஆவணங்களை ஒரு நீர்ப்রதிরோधी பையில் சேகரிக்கவும்\n3. குடும்ப உறுப்பினர்களுக்கு அறிவிக்கவும்\n4. அவசர எண்கள் (DMC: 1999, பொலிசு: 119) அருகில் வைத்திருக்கவும்\n5. மதிப்புள்ள பொருட்களை உயர் இடங்களிற்கு நகர்த்தவும்`;
    }

    // Agriculture help
    if (lower.includes('farm') || lower.includes('crop') || lower.includes('agriculture')) {
      if (language === 'en') {
        return `For agricultural protection:\n✓ Move seeds and livestock to higher ground immediately\n✓ Drain excess water from fields if possible\n✓ Protect wells and water sources\n✓ Document crop losses for insurance claims\n✓ Contact your agricultural extension officer\n\nWould you like specific crop protection tips?`;
      }
      if (language === 'si') {
        return `ගොවිතැනුම් ගිණුමට අපි:\n✓ බීජ සහ පशු-දෙවීයන්ට ඉහල භූමිය වෙතට ක්ષණිකව ගෙන යන්න\n✓ ක්ෂේත්‍රවලින් අතිරික්ත ජලය ඉවත් කරන්න\n✓ ජුඩු සහ ජල සම්භවය ගිණුම් කරන්න\n✓ ෙසවනු ඇතිනු පිණිස ගොවිතැනුම් සම්බන්ධතා කර්මාන්තය අමතන්න`;
      }
      return `விவசாயப் பாதுகாப்புக்கான அரிசி:\n✓ விதைகளை மற்றும் கால்நடைகளை உயர் பூமிக்கு உடனடியாக நகர்த்துங்கள்\n✓ வயல்களிலிருந்து அதிகப்படியான நீரை வடிகட்டவும்\n✓ கிணறுகள் மற்றும் நீர் மூலங்களை பாதுகாக்கவும்\n✓ பயிர் இழப்புகளை காப்பீடு கூறுவதற்காக ஆவணப்படுத்தவும்`;
    }

    // Default response
    if (language === 'en') {
      return 'I can help you with: current safety status, evacuation routes, what to do now, agricultural tips, or family safety. What would you like to know?';
    }
    if (language === 'si') {
      return 'මට සහාය කළ හැකි දේ: වර්තමාන ආරක්ෂිතභාවය, ඉවත් කිරීමේ මග, දැන් කළ යුතු දේ, ගොවිතැනුම් ඉඟි, හෝ පරිවාර ආරක්ෂිතභාවය. ඔබ දැනගැනීමට කැමති දැයි?';
    }
    return 'I can help with safety, evacuation, agriculture, or family guidance. What would you like to know?';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const responseText = generateResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: responseText,
        timestamp: new Date(),
        voiceReady: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleVoiceMessage = () => {
    // Placeholder for voice input
    console.log('Voice input not yet implemented');
  };

  const handleTextToSpeech = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = language === 'en' ? 'en-US' : language === 'si' ? 'si-LK' : 'ta-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chatbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Flood Safety Assistant</h3>
                <p className="text-blue-100 text-xs">Always here to help</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="hover:bg-blue-500 p-1 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.type === 'assistant' && message.voiceReady && (
                      <button
                        onClick={() => handleTextToSpeech(message.id)}
                        className="mt-2 flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                      >
                        <Volume2 size={14} /> Hear it
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none">
                    <Loader size={18} className="animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <button
                onClick={handleVoiceMessage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <Mic size={16} /> Speak
              </button>
              <div className="text-xs text-gray-500 text-center">
                💡 Try: "Am I in danger?", "What should I do now?", "Help my farm"
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
