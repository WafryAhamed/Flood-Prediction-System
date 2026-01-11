import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, X, Type, Eye, Volume2, Globe, Zap, Keyboard } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    updateSettings
  } = useAccessibility();
  return <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 left-4 z-50 bg-[#0066FF] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform border-4 border-white" aria-label="Open Accessibility Settings">
        <Accessibility size={24} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {isOpen && <>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsOpen(false)} />
            <motion.div initial={{
          x: '-100%'
        }} animate={{
          x: 0
        }} exit={{
          x: '-100%'
        }} transition={{
          type: 'spring',
          damping: 25
        }} className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
              {/* Header */}
              <div className="bg-[#0066FF] p-6 border-b-4 border-black flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Accessibility size={32} className="text-white" strokeWidth={2.5} />
                  <h2 className="text-2xl font-black uppercase text-white">
                    Accessibility
                  </h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* Settings */}
              <div className="p-6 space-y-8">
                {/* Text Size */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Type size={20} />
                    <h3 className="font-black uppercase text-lg">Text Size</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['normal', 'large', 'xlarge'] as const).map(size => <button key={size} onClick={() => updateSettings({
                  textSize: size
                })} className={`py-3 border-4 border-black font-bold uppercase transition-colors ${settings.textSize === size ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                        {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                      </button>)}
                  </div>
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Eye size={20} />
                    <h3 className="font-black uppercase text-lg">Contrast</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(['normal', 'high'] as const).map(contrast => <button key={contrast} onClick={() => updateSettings({
                  contrast
                })} className={`py-3 border-4 border-black font-bold uppercase transition-colors ${settings.contrast === contrast ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                        {contrast}
                      </button>)}
                  </div>
                </div>

                {/* Voice */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Volume2 size={20} />
                      <h3 className="font-black uppercase text-lg">
                        Voice Reading
                      </h3>
                    </div>
                    <button onClick={() => updateSettings({
                  voiceEnabled: !settings.voiceEnabled
                })} className={`w-16 h-8 rounded-full transition-colors relative ${settings.voiceEnabled ? 'bg-[#00CC00]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.voiceEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={20} />
                    <h3 className="font-black uppercase text-lg">Language</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{
                  code: 'en',
                  label: 'English'
                }, {
                  code: 'si',
                  label: 'සිංහල'
                }, {
                  code: 'ta',
                  label: 'தமிழ்'
                }].map(lang => <button key={lang.code} onClick={() => updateSettings({
                  language: lang.code as any
                })} className={`py-3 border-4 border-black font-bold transition-colors ${settings.language === lang.code ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                        {lang.label}
                      </button>)}
                  </div>
                </div>

                {/* Simplified Mode */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={20} />
                      <h3 className="font-black uppercase text-lg">
                        Simplified Mode
                      </h3>
                    </div>
                    <button onClick={() => updateSettings({
                  simplifiedMode: !settings.simplifiedMode
                })} className={`w-16 h-8 rounded-full transition-colors relative ${settings.simplifiedMode ? 'bg-[#00CC00]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.simplifiedMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Larger buttons, fewer options, clearer steps
                  </p>
                </div>

                {/* Reduced Motion */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Keyboard size={20} />
                      <h3 className="font-black uppercase text-lg">
                        Reduce Motion
                      </h3>
                    </div>
                    <button onClick={() => updateSettings({
                  reducedMotion: !settings.reducedMotion
                })} className={`w-16 h-8 rounded-full transition-colors relative ${settings.reducedMotion ? 'bg-[#00CC00]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.reducedMotion ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Minimize animations for comfort
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t-4 border-black">
                <p className="text-sm font-bold text-gray-600 text-center">
                  Designed for everyone. Settings saved automatically.
                </p>
              </div>
            </motion.div>
          </>}
      </AnimatePresence>
    </>;
}