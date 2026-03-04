import React, { useState } from 'react';
import { Settings, Volume2, Eye, Keyboard, Type, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'extra-large' | 'huge';
  contrastMode: 'normal' | 'high' | 'inverted';
  voiceEnabled: boolean;
  voiceLanguage: 'en' | 'si' | 'ta';
  voiceSpeed: number; // 0.5 to 2.0
  simplifiedMode: boolean;
  keyboardNavigationEnabled: boolean;
  hapticEnabled: boolean;
  darkMode: boolean;
  dyslexiaFont: boolean;
  screenReaderMode: boolean;
  colonialMode: boolean; // Large icons + minimal text
  elderMode: boolean; // Large spacing + simplified
}

interface AccessibilityControlCenterProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
  initialSettings?: Partial<AccessibilitySettings>;
}

export function AccessibilityControlCenter({
  onSettingsChange,
  initialSettings = {},
}: AccessibilityControlCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'motor' | 'cognitive' | 'emergency'>('visual');
  
  const [settings, setSettings] = useState<AccessibilitySettings>({
    textSize: 'normal',
    contrastMode: 'normal',
    voiceEnabled: false,
    voiceLanguage: 'en',
    voiceSpeed: 1,
    simplifiedMode: false,
    keyboardNavigationEnabled: false,
    hapticEnabled: true,
    darkMode: false,
    dyslexiaFont: false,
    screenReaderMode: false,
    colonialMode: false,
    elderMode: false,
    ...initialSettings,
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const textSizeClasses = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
    huge: 'text-2xl',
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-6 right-6 p-3 rounded-full shadow-lg z-30 transition-all ${
          settings.contrastMode === 'inverted'
            ? 'bg-white text-black hover:bg-gray-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Accessibility Settings"
      >
        <Settings size={24} />
      </motion.button>

      {/* Control Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className={`fixed top-0 right-0 h-screen w-96 shadow-2xl z-40 overflow-y-auto ${
            settings.contrastMode === 'inverted' ? 'bg-black' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`p-6 border-b-2 ${
            settings.contrastMode === 'high' 
              ? 'border-black' 
              : settings.contrastMode === 'inverted'
              ? 'border-white'
              : 'border-gray-300'
          }`}>
            <h2 className={`font-bold ${textSizeClasses[settings.textSize]}`}>
              ♿ Accessibility
            </h2>
            <p className={`text-sm ${settings.contrastMode === 'inverted' ? 'text-gray-300' : 'text-gray-600'}`}>
              Customize your experience
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 p-3 border-b-2">
            {['visual', 'audio', 'motor', 'cognitive', 'emergency'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-3 py-2 rounded font-semibold transition-colors text-sm ${
                  activeTab === tab
                    ? settings.contrastMode === 'inverted'
                      ? 'bg-white text-black'
                      : 'bg-blue-600 text-white'
                    : settings.contrastMode === 'inverted'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {tab === 'visual' && '👁️'}
                {tab === 'audio' && '🎧'}
                {tab === 'motor' && '👆'}
                {tab === 'cognitive' && '🧠'}
                {tab === 'emergency' && '🚨'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* VISUAL ACCESSIBILITY */}
            {activeTab === 'visual' && (
              <div className="space-y-4">
                {/* Text Size */}
                <div>
                  <label className={`block font-bold mb-2 ${textSizeClasses[settings.textSize]}`}>
                    <Type size={20} className="inline mr-2" />
                    Text Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['normal', 'large', 'extra-large', 'huge'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSetting('textSize', size as AccessibilitySettings['textSize'])}
                        className={`p-2 rounded border-2 font-bold transition-all ${
                          settings.textSize === size
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className={
                          size === 'normal' ? 'text-xs' :
                          size === 'large' ? 'text-sm' :
                          size === 'extra-large' ? 'text-base' :
                          'text-lg'
                        }>A</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Mode */}
                <div>
                  <label className={`block font-bold mb-2 ${textSizeClasses[settings.textSize]}`}>
                    <Eye size={20} className="inline mr-2" />
                    Contrast Mode
                  </label>
                  <div className="space-y-2">
                    {['normal', 'high', 'inverted'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSetting('contrastMode', mode as AccessibilitySettings['contrastMode'])}
                        className={`w-full p-3 rounded border-2 font-semibold transition-all text-center ${
                          settings.contrastMode === mode
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {mode === 'normal' && '🔲 Normal'}
                        {mode === 'high' && '⬛ High Contrast'}
                        {mode === 'inverted' && '⬜ Inverted'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Mode */}
                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.darkMode 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => updateSetting('darkMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    <Moon size={20} className="inline mr-2" />
                    Dark Mode
                  </span>
                </label>

                {/* Dyslexia Font */}
                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.dyslexiaFont
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.dyslexiaFont}
                    onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    🔤 Dyslexia-Friendly Font
                  </span>
                </label>
              </div>
            )}

            {/* AUDIO ACCESSIBILITY */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.voiceEnabled
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.voiceEnabled}
                    onChange={(e) => updateSetting('voiceEnabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    <Volume2 size={20} className="inline mr-2" />
                    Enable Voice Narration
                  </span>
                </label>

                {settings.voiceEnabled && (
                  <>
                    <div>
                      <label className={`block font-bold mb-2 ${textSizeClasses[settings.textSize]}`}>
                        Language
                      </label>
                      <div className="space-y-2">
                        {['en', 'si', 'ta'].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => updateSetting('voiceLanguage', lang as 'en' | 'si' | 'ta')}
                            className={`w-full p-2 rounded border-2 font-semibold transition-all ${
                              settings.voiceLanguage === lang
                                ? 'border-blue-600 bg-blue-100'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {lang === 'en' && '🇬🇧 English'}
                            {lang === 'si' && '🇱🇰 Sinhala'}
                            {lang === 'ta' && '🇱🇰 Tamil'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={`block font-bold mb-2 ${textSizeClasses[settings.textSize]}`}>
                        Speech Speed: {settings.voiceSpeed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.voiceSpeed}
                        onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.screenReaderMode
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.screenReaderMode}
                    onChange={(e) => updateSetting('screenReaderMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    📱 Screen Reader Mode
                  </span>
                </label>
              </div>
            )}

            {/* MOTOR ACCESSIBILITY */}
            {activeTab === 'motor' && (
              <div className="space-y-4">
                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.keyboardNavigationEnabled
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.keyboardNavigationEnabled}
                    onChange={(e) => updateSetting('keyboardNavigationEnabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    <Keyboard size={20} className="inline mr-2" />
                    Full Keyboard Navigation
                  </span>
                </label>

                <div className={`p-3 bg-blue-50 rounded ${settings.contrastMode === 'inverted' ? 'bg-gray-800' : ''}`}>
                  <p className={`text-sm font-semibold ${textSizeClasses[settings.textSize]}`}>
                    💡 Enabled keyboard shortcuts:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>Tab - Navigate forward</li>
                    <li>Shift+Tab - Navigate backward</li>
                    <li>Enter - Activate button</li>
                    <li>Space - Toggle checkbox</li>
                  </ul>
                </div>

                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.hapticEnabled
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.hapticEnabled}
                    onChange={(e) => updateSetting('hapticEnabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    ⚡ Haptic Feedback
                  </span>
                </label>
              </div>
            )}

            {/* COGNITIVE ACCESSIBILITY */}
            {activeTab === 'cognitive' && (
              <div className="space-y-4">
                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.simplifiedMode
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.simplifiedMode}
                    onChange={(e) => updateSetting('simplifiedMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    🎯 Simplified Mode
                  </span>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.colonialMode
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.colonialMode}
                    onChange={(e) => updateSetting('colonialMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    🎨 Icon-First Mode
                  </span>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                  settings.elderMode
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={settings.elderMode}
                    onChange={(e) => updateSetting('elderMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className={`font-semibold ${textSizeClasses[settings.textSize]}`}>
                    👴 Elder Mode (Extra Spacing)
                  </span>
                </label>

                <div className={`p-3 bg-blue-50 rounded ${settings.contrastMode === 'inverted' ? 'bg-gray-800' : ''}`}>
                  <p className={`text-sm font-semibold ${textSizeClasses[settings.textSize]}`}>
                    ✓ These modes:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Reduce information overload</li>
                    <li>• Use larger spacing</li>
                    <li>• Simplify language</li>
                    <li>• Focus on main actions</li>
                  </ul>
                </div>
              </div>
            )}

            {/* EMERGENCY MODE */}
            {activeTab === 'emergency' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-3 border-red-600 bg-red-50 ${
                  settings.contrastMode === 'inverted' ? 'bg-red-900' : ''
                }`}>
                  <h3 className={`font-bold text-red-700 mb-2 ${textSizeClasses['huge']}`}>
                    🚨 EMERGENCY OVERRIDE
                  </h3>
                  <p className={`text-sm text-red-600 mb-4 ${textSizeClasses[settings.textSize]}`}>
                    All accessibility features deactivate during emergencies for speed. This screen is always accessible via Settings icon.
                  </p>
                  <button
                    onClick={() => alert('Emergency mode activated - contact DMC at 1999')}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-colors"
                  >
                    🆘 I NEED HELP NOW
                  </button>
                </div>

                <div className={`p-3 bg-green-50 rounded ${
                  settings.contrastMode === 'inverted' ? 'bg-green-900' : ''
                }`}>
                  <p className={`font-bold text-green-700 mb-2 ${textSizeClasses[settings.textSize]}`}>
                    Emergency Contacts:
                  </p>
                  <div className="space-y-1 text-sm font-semibold">
                    <p>📞 DMC (Disaster Management): <strong>1999</strong></p>
                    <p>🚨 Police: <strong>119</strong></p>
                    <p>🚑 Ambulance: <strong>110</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="p-4 border-t-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Close Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed top-0 left-0 right-0 bottom-0 z-20"
        />
      )}
    </>
  );
}
