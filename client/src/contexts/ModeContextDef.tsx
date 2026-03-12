import { createContext } from 'react';

export type FloodMode = 'normal' | 'watch' | 'emergency' | 'recovery';

export interface ModeConfig {
  mode: FloodMode;
  buttonSize: 'sm' | 'md' | 'lg';
  spacing: 'compact' | 'normal' | 'loose';
  informationDensity: 'minimal' | 'normal' | 'detailed';
  colorScheme: 'neutral' | 'alert' | 'critical';
  fontSize: 'sm' | 'md' | 'lg';
  navigationStyle: 'icons' | 'text-labels' | 'full';
  showCriticalOnly: boolean;
  autoExpand: boolean;
}

export interface ModeContextType {
  currentMode: FloodMode;
  config: ModeConfig;
  setMode: (mode: FloodMode) => void;
  getConfig: () => ModeConfig;
  getModeName: () => string;
  getModeEmoji: () => string;
  getModeColor: () => string;
}

export const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const modeConfigs: Record<FloodMode, ModeConfig> = {
  normal: {
    mode: 'normal',
    buttonSize: 'md',
    spacing: 'normal',
    informationDensity: 'detailed',
    colorScheme: 'neutral',
    fontSize: 'md',
    navigationStyle: 'full',
    showCriticalOnly: false,
    autoExpand: false,
  },
  watch: {
    mode: 'watch',
    buttonSize: 'md',
    spacing: 'normal',
    informationDensity: 'normal',
    colorScheme: 'alert',
    fontSize: 'md',
    navigationStyle: 'text-labels',
    showCriticalOnly: false,
    autoExpand: true,
  },
  emergency: {
    mode: 'emergency',
    buttonSize: 'lg',
    spacing: 'loose',
    informationDensity: 'minimal',
    colorScheme: 'critical',
    fontSize: 'lg',
    navigationStyle: 'icons',
    showCriticalOnly: true,
    autoExpand: true,
  },
  recovery: {
    mode: 'recovery',
    buttonSize: 'md',
    spacing: 'normal',
    informationDensity: 'normal',
    colorScheme: 'neutral',
    fontSize: 'md',
    navigationStyle: 'full',
    showCriticalOnly: false,
    autoExpand: false,
  },
};
