// ─── Admin Control Store ───
// Single Zustand store for all admin→user control paths.
// Admin pages write to this store; user pages read from it.
// All data is populated from backend bootstrap and real-time sync.

import { create } from 'zustand';
import { saveAdminControlState } from '../services/integrationApi';
import type {
  BroadcastFeedItem,
  DashboardResource,
  AgricultureAdvisory,
  AgricultureActionItem,
  AgricultureRiskZone,
  RecoveryProgressItem,
  RecoveryCriticalNeed,
  RecoveryUpdate,
  RecoveryResource,
  LearnGuide,
  LearnTipSection,
  FeaturedWisdom,
  FrontendSettings,
  PageVisibilityConfig,
} from '../types/admin';
import type { FloodMode } from '../contexts/ModeContextDef';

// ═══ Default Configuration ═══

const DEFAULT_PAGE_VISIBILITY: PageVisibilityConfig = {
  dashboard: true,
  riskMap: true,
  communityReports: true,
  evacuation: true,
  history: true,
  whatIf: true,
  agriculture: true,
  recovery: true,
  learnHub: true,
  safetyProfile: true,
};

const DEFAULT_SETTINGS: FrontendSettings = {
  emergencyBannerActive: false,
  emergencyBannerMessage: '',
  emergencyBannerRiskLevel: 'CRITICAL',
  siteFloodMode: 'normal',
  pageVisibility: DEFAULT_PAGE_VISIBILITY,
  maintenanceMode: false,
};

// ═══ Store Interface ═══

interface AdminControlStore {
  hydrateFromBackend: (state: Record<string, unknown>) => void;

  // Broadcast feed
  broadcastFeed: BroadcastFeedItem[];
  addBroadcastItem: (item: Omit<BroadcastFeedItem, 'id'>) => void;
  removeBroadcastItem: (id: string) => void;
  toggleBroadcastItem: (id: string) => void;

  // Dashboard resources
  dashboardResources: DashboardResource[];
  updateResource: (id: string, updates: Partial<DashboardResource>) => void;

  // Agriculture
  agricultureAdvisories: AgricultureAdvisory[];
  updateAdvisory: (id: string, updates: Partial<AgricultureAdvisory>) => void;
  agricultureActions: AgricultureActionItem[];
  updateAction: (id: string, text: string) => void;
  agricultureZones: AgricultureRiskZone[];
  updateZone: (id: string, updates: Partial<AgricultureRiskZone>) => void;

  // Recovery
  recoveryProgress: RecoveryProgressItem[];
  updateRecoveryProgress: (id: string, percent: number) => void;
  recoveryNeeds: RecoveryCriticalNeed[];
  updateRecoveryNeed: (id: string, updates: Partial<RecoveryCriticalNeed>) => void;
  recoveryUpdates: RecoveryUpdate[];
  addRecoveryUpdate: (item: Omit<RecoveryUpdate, 'id'>) => void;
  recoveryResources: RecoveryResource[];

  // Learn Hub
  learnGuides: LearnGuide[];
  updateLearnGuide: (id: string, updates: Partial<LearnGuide>) => void;
  learnTips: LearnTipSection[];
  updateLearnTips: (id: string, tips: string[]) => void;
  featuredWisdom: FeaturedWisdom;
  updateFeaturedWisdom: (updates: Partial<FeaturedWisdom>) => void;

  // Frontend settings
  frontendSettings: FrontendSettings;
  updateFrontendSettings: (updates: Partial<FrontendSettings>) => void;
  setPageVisibility: (page: keyof PageVisibilityConfig, visible: boolean) => void;
  setSiteFloodMode: (mode: FloodMode) => void;
}

let nextBroadcastId = 100;
let nextRecoveryUpdateId = 100;

function pickPersistableState(state: AdminControlStore) {
  return {
    broadcastFeed: state.broadcastFeed,
    dashboardResources: state.dashboardResources,
    agricultureAdvisories: state.agricultureAdvisories,
    agricultureActions: state.agricultureActions,
    agricultureZones: state.agricultureZones,
    recoveryProgress: state.recoveryProgress,
    recoveryNeeds: state.recoveryNeeds,
    recoveryUpdates: state.recoveryUpdates,
    recoveryResources: state.recoveryResources,
    learnGuides: state.learnGuides,
    learnTips: state.learnTips,
    featuredWisdom: state.featuredWisdom,
    frontendSettings: state.frontendSettings,
  };
}

/**
 * CRITICAL FIX #4: Debounced persistence to prevent concurrent saves
 * Multiple rapid mutations would normally trigger multiple concurrent API calls
 * This debounces them to a single call after 500ms of inactivity
 */
let persistenceTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (state: ReturnType<typeof pickPersistableState>) => {
  if (persistenceTimeout) {
    clearTimeout(persistenceTimeout);
  }
  persistenceTimeout = setTimeout(() => {
    void saveAdminControlState(state);
    persistenceTimeout = null;
  }, 500);
};

export const useAdminControlStore = create<AdminControlStore>((set, get) => ({
  hydrateFromBackend: (incoming) => {
    const source = incoming as Partial<ReturnType<typeof pickPersistableState>>;
    set((state) => ({
      broadcastFeed: source.broadcastFeed || state.broadcastFeed,
      dashboardResources: source.dashboardResources || state.dashboardResources,
      agricultureAdvisories: source.agricultureAdvisories || state.agricultureAdvisories,
      agricultureActions: source.agricultureActions || state.agricultureActions,
      agricultureZones: source.agricultureZones || state.agricultureZones,
      recoveryProgress: source.recoveryProgress || state.recoveryProgress,
      recoveryNeeds: source.recoveryNeeds || state.recoveryNeeds,
      recoveryUpdates: source.recoveryUpdates || state.recoveryUpdates,
      recoveryResources: source.recoveryResources || state.recoveryResources,
      learnGuides: source.learnGuides || state.learnGuides,
      learnTips: source.learnTips || state.learnTips,
      featuredWisdom: source.featuredWisdom || state.featuredWisdom,
      frontendSettings: source.frontendSettings || state.frontendSettings,
    }));
  },

  // ── Broadcast Feed ──
  broadcastFeed: [],
  addBroadcastItem: (item) => {
    set((s) => ({
      broadcastFeed: [{ ...item, id: `bf-${nextBroadcastId++}` }, ...s.broadcastFeed],
    }));
    debouncedSave(pickPersistableState(get()));
  },
  removeBroadcastItem: (id) => {
    set((s) => ({
      broadcastFeed: s.broadcastFeed.filter((b) => b.id !== id),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  toggleBroadcastItem: (id) => {
    set((s) => ({
      broadcastFeed: s.broadcastFeed.map((b) => b.id === id ? { ...b, active: !b.active } : b),
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Dashboard Resources ──
  dashboardResources: [],
  updateResource: (id, updates) => {
    set((s) => ({
      dashboardResources: s.dashboardResources.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Agriculture ──
  agricultureAdvisories: [],
  updateAdvisory: (id, updates) => {
    set((s) => ({
      agricultureAdvisories: s.agricultureAdvisories.map((a) => a.id === id ? { ...a, ...updates } : a),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  agricultureActions: [],
  updateAction: (id, text) => {
    set((s) => ({
      agricultureActions: s.agricultureActions.map((a) => a.id === id ? { ...a, text } : a),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  agricultureZones: [],
  updateZone: (id, updates) => {
    set((s) => ({
      agricultureZones: s.agricultureZones.map((z) => z.id === id ? { ...z, ...updates } : z),
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Recovery ──
  recoveryProgress: [],
  updateRecoveryProgress: (id, percent) => {
    set((s) => ({
      recoveryProgress: s.recoveryProgress.map((p) => p.id === id ? { ...p, percent: Math.max(0, Math.min(100, percent)) } : p),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryNeeds: [],
  updateRecoveryNeed: (id, updates) => {
    set((s) => ({
      recoveryNeeds: s.recoveryNeeds.map((n) => n.id === id ? { ...n, ...updates } : n),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryUpdates: [],
  addRecoveryUpdate: (item) => {
    set((s) => ({
      recoveryUpdates: [{ ...item, id: `ru-${nextRecoveryUpdateId++}` }, ...s.recoveryUpdates],
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryResources: [],

  // ── Learn Hub ──
  learnGuides: [],
  updateLearnGuide: (id, updates) => {
    set((s) => ({
      learnGuides: s.learnGuides.map((g) => g.id === id ? { ...g, ...updates } : g),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  learnTips: [],
  updateLearnTips: (id, tips) => {
    set((s) => ({
      learnTips: s.learnTips.map((t) => t.id === id ? { ...t, tips } : t),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  featuredWisdom: {
    quote: '',
    source: '',
    visible: false,
  },
  updateFeaturedWisdom: (updates) => {
    set((s) => ({
      featuredWisdom: { ...s.featuredWisdom, ...updates },
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Frontend Settings ──
  frontendSettings: DEFAULT_SETTINGS,
  updateFrontendSettings: (updates) => {
    set((s) => ({
      frontendSettings: { ...s.frontendSettings, ...updates },
    }));
    debouncedSave(pickPersistableState(get()));
  },
  setPageVisibility: (page, visible) => {
    set((s) => ({
      frontendSettings: {
        ...s.frontendSettings,
        pageVisibility: { ...s.frontendSettings.pageVisibility, [page]: visible },
      },
    }));
    debouncedSave(pickPersistableState(get()));
  },
  setSiteFloodMode: (mode) => {
    set((s) => ({
      frontendSettings: { ...s.frontendSettings, siteFloodMode: mode },
    }));
    debouncedSave(pickPersistableState(get()));
  },
}));
