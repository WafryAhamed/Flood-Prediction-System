import React, { useEffect, useState, createContext, useContext } from 'react';
interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'xlarge';
  contrast: 'normal' | 'high';
  voiceEnabled: boolean;
  language: 'en' | 'si' | 'ta';
  simplifiedMode: boolean;
  reducedMotion: boolean;
  keyboardNav: boolean;
}
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
}
const defaultSettings: AccessibilitySettings = {
  textSize: 'normal',
  contrast: 'normal',
  voiceEnabled: false,
  language: 'en',
  simplifiedMode: false,
  reducedMotion: false,
  keyboardNav: true
};
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
export function AccessibilityProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const stored = localStorage.getItem('accessibility-settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  });
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    // Apply settings to document
    document.documentElement.setAttribute('data-text-size', settings.textSize);
    document.documentElement.setAttribute('data-contrast', settings.contrast);
    document.documentElement.setAttribute('data-simplified', settings.simplifiedMode.toString());
    if (settings.reducedMotion) {
      document.documentElement.style.setProperty('--motion-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--motion-duration');
    }
  }, [settings]);
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };
  return <AccessibilityContext.Provider value={{
    settings,
    updateSettings
  }}>
      {children}
    </AccessibilityContext.Provider>;
}
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}