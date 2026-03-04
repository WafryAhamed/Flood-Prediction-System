import React, { useState, ReactNode } from 'react';
import { useFloodMode, useModeSpacing } from '../hooks/useFloodMode';
import { ModeContextType, FloodMode, modeConfigs, ModeContext } from './ModeContextDef';

/**
 * Provides UI mode context to entire app
 * Modes: Normal (planning) → Watch (alert) → Emergency (active crisis) → Recovery (aftermath)
 */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<FloodMode>('normal');

  const context: ModeContextType = {
    currentMode,
    config: modeConfigs[currentMode],
    setMode: (mode: FloodMode) => {
      console.log(`🎯 Flood mode changed: ${currentMode} → ${mode}`);
      setCurrentMode(mode);
    },
    getConfig: () => modeConfigs[currentMode],
    getModeName: () => {
      const names: Record<FloodMode, string> = {
        normal: 'Normal Operations',
        watch: 'Watch Alert',
        emergency: 'Emergency Mode',
        recovery: 'Recovery Phase',
      };
      return names[currentMode];
    },
    getModeEmoji: () => {
      const emojis: Record<FloodMode, string> = {
        normal: '🌤️',
        watch: '👀',
        emergency: '🆘',
        recovery: '🔧',
      };
      return emojis[currentMode];
    },
    getModeColor: () => {
      const colors: Record<FloodMode, string> = {
        normal: 'bg-blue-600',
        watch: 'bg-orange-600',
        emergency: 'bg-red-700',
        recovery: 'bg-purple-600',
      };
      return colors[currentMode];
    },
  };

  return <ModeContext.Provider value={context}>{children}</ModeContext.Provider>;
}

/**
 * Hook to access mode context
 * Usage: const { currentMode, config, setMode } = useFloodMode();
 * (Moved to useFloodMode.ts for Fast Refresh compatibility)
 */

/**
 * Component to display current mode and allow manual switching
 */
export function ModeSelector() {
  const { currentMode, setMode, getModeName, getModeEmoji, getModeColor, config } = useFloodMode();

  const modes: FloodMode[] = ['normal', 'watch', 'emergency', 'recovery'];

  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-lg text-white font-bold text-center ${getModeColor()} transition-all`}>
        <p className="text-3xl">{getModeEmoji()}</p>
        <p className="text-lg mt-1">{getModeName()}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const isActive = currentMode === mode;
          const modeEmojis: Record<FloodMode, string> = {
            normal: '🌤️',
            watch: '👀',
            emergency: '🆘',
            recovery: '🔧',
          };
          const modeLabels: Record<FloodMode, string> = {
            normal: 'Normal',
            watch: 'Watch',
            emergency: 'Emergency',
            recovery: 'Recovery',
          };

          return (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`p-3 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-900'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {modeEmojis[mode]} {modeLabels[mode]}
            </button>
          );
        })}
      </div>

      {/* Config Details */}
      <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
        <p className="font-semibold text-gray-900">Current Configuration:</p>
        <div className="grid grid-cols-2 gap-1 text-gray-700">
          <p>📊 Information: {config.informationDensity}</p>
          <p>🎨 Scheme: {config.colorScheme}</p>
          <p>📏 Button: {config.buttonSize}</p>
          <p>🧿 Spacing: {config.spacing}</p>
          <p>🔤 Font: {config.fontSize}</p>
          <p>🗺️ Nav: {config.navigationStyle}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for responsive component styling based on current mode
 * Usage: const spacing = useModeSpacing();
 * (Moved to useFloodMode.ts for Fast Refresh compatibility)
 */

/**
 * Hook for color scheme based on mode
 * (Moved to useFloodMode.ts for Fast Refresh compatibility)
 */

/**
 * Responsive component wrapper that adapts to current flood mode
 */
export function ModeResponsiveContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const spacing = useModeSpacing();
  const { config } = useFloodMode();

  return (
    <div
      className={`
        ${spacing.section}
        ${config.fontSize === 'lg' ? 'text-lg' : config.fontSize === 'sm' ? 'text-sm' : 'text-base'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Conditional render component - only shows content in specified modes
 */
export function ModeConditional({
  children,
  modes,
}: {
  children: ReactNode;
  modes: FloodMode[];
}) {
  const { currentMode } = useFloodMode();
  if (!modes.includes(currentMode)) return null;
  return <>{children}</>;
}

/**
 * Critical information banner - always visible in emergency/watch modes
 */
export function CriticalInfoBanner({ message, action }: { message: string; action?: () => void }) {
  const { config, getModeEmoji } = useFloodMode();

  if (!config.showCriticalOnly && config.mode !== 'watch' && config.mode !== 'emergency') {
    return null;
  }

  return (
    <div className="bg-red-600 text-white p-4 rounded-lg font-bold flex justify-between items-center">
      <span>
        {getModeEmoji()} {message}
      </span>
      {action && (
        <button onClick={action} className="bg-white text-red-600 px-4 py-1 rounded font-bold">
          ACT NOW
        </button>
      )}
    </div>
  );
}
