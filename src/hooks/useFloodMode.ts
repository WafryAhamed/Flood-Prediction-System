import { useContext } from 'react';
import { ModeContext, ModeContextType } from '../contexts/ModeContextDef';

/**
 * Hook to access mode context
 * Usage: const { currentMode, config, setMode } = useFloodMode();
 */
export function useFloodMode(): ModeContextType {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useFloodMode must be used within ModeProvider');
  }
  return context;
}

/**
 * Hook for responsive component styling based on current mode
 * Usage: const spacing = useModeSpacing();
 */
export function useModeSpacing(): {
  section: string;
  card: string;
  button: string;
  text: string;
} {
  const { config } = useFloodMode();

  const spacingMap = {
    compact: { section: 'gap-2 p-2', card: 'p-2', button: 'px-2 py-1', text: 'text-xs' },
    normal: { section: 'gap-4 p-4', card: 'p-4', button: 'px-4 py-2', text: 'text-sm' },
    loose: { section: 'gap-6 p-6', card: 'p-6', button: 'px-6 py-3', text: 'text-base' },
  };

  return spacingMap[config.spacing];
}

/**
 * Hook for color scheme based on mode
 */
export function useModePalette(): {
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  background: string;
  surface: string;
} {
  const { config } = useFloodMode();

  const colorSchemes = {
    neutral: {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      danger: 'text-red-600',
      success: 'text-green-600',
      background: 'bg-white',
      surface: 'bg-gray-50',
    },
    alert: {
      primary: 'text-orange-600',
      secondary: 'text-orange-500',
      danger: 'text-red-700',
      success: 'text-green-600',
      background: 'bg-orange-50',
      surface: 'bg-orange-100',
    },
    critical: {
      primary: 'text-red-700',
      secondary: 'text-red-600',
      danger: 'text-red-800',
      success: 'text-green-600',
      background: 'bg-red-50',
      surface: 'bg-red-100',
    },
  };

  return colorSchemes[config.colorScheme];
}
