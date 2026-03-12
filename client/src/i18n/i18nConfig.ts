// i18n configuration for multilingual support (EN/SI/TA)
import { create } from 'zustand';

export type Language = 'en' | 'si' | 'ta';

export interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Create i18n store for global language state
export const useI18nStore = create<I18nStore>((set) => ({
  language: detectLanguage(),
  setLanguage: (language: Language) => {
    set({ language });
    localStorage.setItem('floodweb-language', language);
  },
}));

// Core translation keys and structure
export const i18nKeys = {
  nav: {
    emergency: 'nav.emergency',
    riskMap: 'nav.riskMap',
    evacuation: 'nav.evacuation',
    community: 'nav.community',
    learn: 'nav.learn',
    recovery: 'nav.recovery',
    agriculture: 'nav.agriculture',
    timeline: 'nav.timeline',
    whatNext: 'nav.whatNext',
    admin: 'nav.admin',
  },
  dashboard: {
    title: 'dashboard.title',
    riskLevel: 'dashboard.riskLevel',
    evacuationRoutes: 'dashboard.evacuationRoutes',
    nearbyFacilities: 'dashboard.nearbyFacilities',
    communityReports: 'dashboard.communityReports',
    familyStatus: 'dashboard.familyStatus',
    whatShouldIDo: 'dashboard.whatShouldIDo',
    myProfile: 'dashboard.myProfile',
  },
  risk: {
    critical: 'risk.critical',
    high: 'risk.high',
    medium: 'risk.medium',
    low: 'risk.low',
    safe: 'risk.safe',
  },
  alert: {
    title: 'alert.title',
    warning: 'alert.warning',
    information: 'alert.information',
    allClear: 'alert.allClear',
    acknowledge: 'alert.acknowledge',
    share: 'alert.share',
    dismiss: 'alert.dismiss',
  },
  action: {
    save: 'action.save',
    cancel: 'action.cancel',
    next: 'action.next',
    previous: 'action.previous',
    complete: 'action.complete',
    back: 'action.back',
    submit: 'action.submit',
    edit: 'action.edit',
    delete: 'action.delete',
    close: 'action.close',
    add: 'action.add',
    remove: 'action.remove',
  },
  common: {
    success: 'common.success',
    error: 'common.error',
    loading: 'common.loading',
    noData: 'common.noData',
    tryAgain: 'common.tryAgain',
  },
};

// Language detector
export function detectLanguage(): Language {
  const saved = localStorage.getItem('floodweb-language');
  if (saved === 'en' || saved === 'si' || saved === 'ta') return saved;
  
  const browserLang = navigator?.language?.split('-')[0];
  if (browserLang === 'si') return 'si';
  if (browserLang === 'ta') return 'ta';
  return 'en';
}

// Format strings with parameters
export function formatString(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] || ''));
}

// TTS Language Codes
export const TTSLanguageCodes = {
  en: 'en-US',
  si: 'si-LK',
  ta: 'ta-IN',
} as const;

// TTS Voice Configuration
export const TTSVoiceConfig = {
  en: { rate: 1, pitch: 1, volume: 1 },
  si: { rate: 0.9, pitch: 1, volume: 1 },
  ta: { rate: 0.9, pitch: 1, volume: 1 },
} as const;

export interface TTSOptions {
  language: Language;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// TTS Utility Function
export function speak(text: string, options: TTSOptions = { language: 'en' }): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTSLanguageCodes[options.language];
    utterance.rate = options.rate ?? TTSVoiceConfig[options.language].rate;
    utterance.pitch = options.pitch ?? TTSVoiceConfig[options.language].pitch;
    utterance.volume = options.volume ?? TTSVoiceConfig[options.language].volume;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.speak(utterance);
  });
}
