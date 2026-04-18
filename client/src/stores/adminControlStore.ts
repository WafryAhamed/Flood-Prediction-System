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
  broadcastFeed: [
    {
      id: 'bf-1',
      type: 'critical',
      time: new Date(Date.now() - 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: 'CRITICAL: Immediate evacuation ordered for Colombo low-lying areas. Flash floods detected in Kelani River.',
      active: true,
    },
    {
      id: 'bf-2',
      type: 'warning',
      time: new Date(Date.now() - 45 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: 'HIGH ALERT: Gampaha District – Heavy rainfall continues. Multiple shelters activated. 5,000+ evacuated.',
      active: true,
    },
    {
      id: 'bf-3',
      type: 'caution',
      time: new Date(Date.now() - 90 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: 'CAUTION: Batticaloa District – Lagoon overflow predicted in 2 hours. Evacuation routes open.',
      active: true,
    },
    {
      id: 'bf-4',
      type: 'info',
      time: new Date(Date.now() - 150 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: 'INFO: Kandy District – Relief supplies distributed. 200 family units assisted so far.',
      active: true,
    },
    {
      id: 'bf-5',
      type: 'info',
      time: new Date(Date.now() - 240 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: 'UPDATE: Highway A9 partially cleared. Traffic restored on critical segments.',
      active: false,
    },
  ],
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
  dashboardResources: [
    {
      id: 'dr-1',
      name: 'Mobile Medical Units',
      status: 'AVAILABLE',
      statusColor: 'bg-green-600',
      visible: true,
    },
    {
      id: 'dr-2',
      name: 'Temporary Shelters',
      status: 'FULL',
      statusColor: 'bg-yellow-600',
      visible: true,
    },
    {
      id: 'dr-3',
      name: 'Water Purification Units',
      status: 'AVAILABLE',
      statusColor: 'bg-green-600',
      visible: true,
    },
    {
      id: 'dr-4',
      name: 'Heavy Machinery',
      status: 'BUSY',
      statusColor: 'bg-orange-600',
      visible: true,
    },
    {
      id: 'dr-5',
      name: 'Rescue Boats & Equipment',
      status: 'AVAILABLE',
      statusColor: 'bg-green-600',
      visible: true,
    },
    {
      id: 'dr-6',
      name: 'Relief Food Packages',
      status: 'FULL',
      statusColor: 'bg-yellow-600',
      visible: true,
    },
    {
      id: 'dr-7',
      name: 'Blankets & Clothing',
      status: 'FULL',
      statusColor: 'bg-yellow-600',
      visible: true,
    },
    {
      id: 'dr-8',
      name: 'Power Generators',
      status: 'AVAILABLE',
      statusColor: 'bg-green-600',
      visible: true,
    },
  ],
  updateResource: (id, updates) => {
    set((s) => ({
      dashboardResources: s.dashboardResources.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Agriculture ──
  agricultureAdvisories: [
    {
      id: 'aa-1',
      cropName: 'Paddy (Rice)',
      iconName: 'Sprout',
      statusLabel: 'Alert',
      statusColor: 'bg-red-600 text-white',
      message: 'High water saturation detected in Colombo District. Recommend immediate drainage and elevated seed beds. Monitor water levels daily.',
    },
    {
      id: 'aa-2',
      cropName: 'Tea',
      iconName: 'Sprout',
      statusLabel: 'Caution',
      statusColor: 'bg-yellow-500 text-white',
      message: 'Moderate rainfall expected. Ensure proper drainage on slopes. Consider harvesting if ripe to avoid water damage.',
    },
    {
      id: 'aa-3',
      cropName: 'Coconut',
      iconName: 'Sprout',
      statusLabel: 'Safe',
      statusColor: 'bg-green-500 text-white',
      message: 'Coconut plants showing resilience. Continue regular monitoring. Secure loose fronds and fallen nuts.',
    },
    {
      id: 'aa-4',
      cropName: 'Rubber',
      iconName: 'CloudRain',
      statusLabel: 'Alert',
      statusColor: 'bg-red-600 text-white',
      message: 'Heavy waterlogging in Eastern plantations. Implement immediate lateral drainage systems to prevent root rot.',
    },
    {
      id: 'aa-5',
      cropName: 'Cinnamon',
      iconName: 'Droplets',
      statusLabel: 'Caution',
      statusColor: 'bg-yellow-500 text-white',
      message: 'Moisture levels elevated in Central District. Watch for fungal diseases. Apply fungicide if needed.',
    },
    {
      id: 'aa-6',
      cropName: 'Vegetables',
      iconName: 'Sprout',
      statusLabel: 'Alert',
      statusColor: 'bg-red-600 text-white',
      message: 'Tomatoes and chilies at risk in waterlogged areas. Consider raised beds and plastic mulching.',
    },
  ],
  updateAdvisory: (id, updates) => {
    set((s) => ({
      agricultureAdvisories: s.agricultureAdvisories.map((a) => a.id === id ? { ...a, ...updates } : a),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  agricultureActions: [
    { id: 'aa-act-1', text: 'Create emergency drainage channels in low-lying areas', order: 1 },
    { id: 'aa-act-2', text: 'Distribute high-elevation crop seeds to farmers', order: 2 },
    { id: 'aa-act-3', text: 'Organize livestock evacuation to higher ground shelters', order: 3 },
    { id: 'aa-act-4', text: 'Deploy soil conservation teams to prevent erosion', order: 5 },
    { id: 'aa-act-5', text: 'Prepare crop insurance claim support for affected farmers', order: 6 },
    { id: 'aa-act-6', text: 'Monitor fertilizer and pesticide runoff pollution', order: 7 },
    { id: 'aa-act-7', text: 'Begin community meetings on flood-resistant farming techniques', order: 8 },
  ],
  updateAction: (id, text) => {
    set((s) => ({
      agricultureActions: s.agricultureActions.map((a) => a.id === id ? { ...a, text } : a),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  agricultureZones: [
    {
      id: 'az-1',
      label: 'High Risk',
      riskLevel: 'CRITICAL' as const,
      district: 'Colombo District, Western',
      details: 'Heavy waterlogging in paddy fields. 12,000+ farmers affected. Immediate intervention required.',
      accentColor: 'critical' as const,
    },
    {
      id: 'az-2',
      label: 'High Risk',
      riskLevel: 'CRITICAL' as const,
      district: 'Batticaloa District, Eastern',
      details: 'Extensive flooding in rubber estates. Drainage systems overwhelmed. 4,500 hectares at risk.',
      accentColor: 'critical' as const,
    },
    {
      id: 'az-3',
      label: 'Moderate Risk',
      riskLevel: 'HIGH' as const,
      district: 'Kandy District, Central',
      details: 'Tea plantations experiencing excessive moisture. Early fungal disease signs. Preventive measures advised.',
      accentColor: 'high' as const,
    },
    {
      id: 'az-4',
      label: 'Moderate Risk',
      riskLevel: 'HIGH' as const,
      district: 'Matara District, Southern',
      details: 'Vegetable farms and coconut plantations waterlogged. 8,000 hectares monitored.',
      accentColor: 'high' as const,
    },
    {
      id: 'az-5',
      label: 'Caution',
      riskLevel: 'MODERATE' as const,
      district: 'Kurunegala District, North Western',
      details: 'Mixed crops showing resilience. Continued monitoring recommended.',
      accentColor: 'warning' as const,
    },
    {
      id: 'az-6',
      label: 'Caution',
      riskLevel: 'MODERATE' as const,
      district: 'Anuradhapura District, North Central',
      details: 'Livestock feed supplies adequate. Shelters operational for 2,500 animals.',
      accentColor: 'warning' as const,
    },
  ],
  updateZone: (id, updates) => {
    set((s) => ({
      agricultureZones: s.agricultureZones.map((z) => z.id === id ? { ...z, ...updates } : z),
    }));
    debouncedSave(pickPersistableState(get()));
  },

  // ── Recovery ──
  recoveryProgress: [
    { id: 'rp-1', label: 'Water Clearance', percent: 85, color: 'blue' },
    { id: 'rp-2', label: 'Power Restoration', percent: 60, color: 'yellow' },
    { id: 'rp-3', label: 'Road Clearing', percent: 40, color: 'orange' },
    { id: 'rp-4', label: 'Shelter Placement', percent: 95, color: 'green' }
  ],
  updateRecoveryProgress: (id, percent) => {
    set((s) => ({
      recoveryProgress: s.recoveryProgress.map((p) => p.id === id ? { ...p, percent: Math.max(0, Math.min(100, percent)) } : p),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryNeeds: [
    { id: 'rn-1', name: 'Clean Drinking Water', urgency: 'CRITICAL' },
    { id: 'rn-2', name: 'Basic Medical Supplies', urgency: 'HIGH' },
    { id: 'rn-3', name: 'Baby Food & Formula', urgency: 'MEDIUM' },
    { id: 'rn-4', name: 'Warm Blankets', urgency: 'LOW' }
  ],
  updateRecoveryNeed: (id, updates) => {
    set((s) => ({
      recoveryNeeds: s.recoveryNeeds.map((n) => n.id === id ? { ...n, ...updates } : n),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryUpdates: [
    { id: 'ru-1', title: 'Main Highway A9 cleared of debris', iconName: 'Truck', time: '2 hours ago' },
    { id: 'ru-2', title: 'Power restored to Central District', iconName: 'Zap', time: '5 hours ago' },
    { id: 'ru-3', title: 'Mobile medical camps deployed', iconName: 'Activity', time: '12 hours ago' }
  ],
  addRecoveryUpdate: (item) => {
    set((s) => ({
      recoveryUpdates: [{ ...item, id: `ru-${nextRecoveryUpdateId++}` }, ...s.recoveryUpdates],
    }));
    debouncedSave(pickPersistableState(get()));
  },
  recoveryResources: [
    { id: 'rr-1', name: 'Disaster Relief Fund', detail: 'Financial assistance application for damaged homes and local businesses.' },
    { id: 'rr-2', name: 'Food Distribution Center', detail: 'Open 24/7 at the main city hall. No registration required.' },
    { id: 'rr-3', name: 'Volunteer Signup', detail: 'Join the local cleanup crews and help restore the community.' }
  ],

  // ── Learn Hub ──
  learnGuides: [
    {
      id: 'lg-1',
      title: 'Emergency Kit Preparation',
      iconName: 'Package',
      description: 'Learn what to pack in your 72-hour survival kit before the flood hits.',
      accentColor: 'blue',
      visible: true
    },
    {
      id: 'lg-2',
      title: 'Immediate Evacuation Steps',
      iconName: 'Navigation',
      description: 'Step-by-step guide on how to safely evacuate your home and find high ground.',
      accentColor: 'red',
      visible: true
    },
    {
      id: 'lg-3',
      title: 'Post-Flood Cleanup Safety',
      iconName: 'ShieldAlert',
      description: 'Crucial health and safety protocols for re-entering a flooded building.',
      accentColor: 'green',
      visible: true
    }
  ],
  updateLearnGuide: (id, updates) => {
    set((s) => ({
      learnGuides: s.learnGuides.map((g) => g.id === id ? { ...g, ...updates } : g),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  learnTips: [
    {
      id: 'lt-1',
      title: 'Before the Flood',
      tips: [
        'Move valuable items to higher floors.',
        'Clear gutters and drains around your property.',
        'Keep important documents in waterproof containers.'
      ]
    },
    {
      id: 'lt-2',
      title: 'During the Flood',
      tips: [
        'Do not walk, swim or drive through flood waters.',
        'Stay away from power lines and electrical wires.',
        'Listen to emergency broadcasts for evacuation orders.'
      ]
    }
  ],
  updateLearnTips: (id, tips) => {
    set((s) => ({
      learnTips: s.learnTips.map((t) => t.id === id ? { ...t, tips } : t),
    }));
    debouncedSave(pickPersistableState(get()));
  },
  featuredWisdom: {
    quote: 'Preparation through education is less costly than learning through tragedy.',
    source: 'Disaster Management Center',
    visible: true,
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
