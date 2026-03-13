// ─── Admin Control Store ───
// Single Zustand store for all admin→user control paths.
// Admin pages write to this store; user pages read from it.
// All data is seeded from current hardcoded values to preserve existing behavior.

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

// ═══ Seed Data (migrated from hardcoded page values) ═══

const SEED_BROADCASTS: BroadcastFeedItem[] = [
  { id: 'bf-1', time: '13:55', text: 'Sector 7 evacuation order issued. Proceed to high ground immediately.', type: 'critical', active: true },
  { id: 'bf-2', time: '13:42', text: 'Water levels exceeding critical threshold at North Bridge.', type: 'warning', active: true },
  { id: 'bf-3', time: '13:30', text: 'Emergency services deployed to downtown area.', type: 'info', active: true },
];

const SEED_RESOURCES: DashboardResource[] = [
  { id: 'res-1', name: 'Shelter A', status: 'OPEN', statusColor: 'bg-green-600', visible: true },
  { id: 'res-2', name: 'Shelter B', status: 'FULL', statusColor: 'bg-red-600', visible: true },
  { id: 'res-3', name: 'Medical Post', status: 'BUSY', statusColor: 'bg-yellow-500', visible: true },
  { id: 'res-4', name: 'Water Supply', status: 'AVAILABLE', statusColor: 'bg-green-600', visible: true },
];

const SEED_AGRI_ADVISORIES: AgricultureAdvisory[] = [
  { id: 'agri-1', cropName: 'Paddy', iconName: 'Sprout', statusLabel: 'Alert', statusColor: 'bg-critical/10 text-critical', message: 'High risk of submersion in next 48h. Delay planting.' },
  { id: 'agri-2', cropName: 'Rainfall', iconName: 'CloudRain', statusLabel: 'Alert', statusColor: 'bg-warning/10 text-warning', message: 'Expected 120mm. Exceeds drainage capacity.' },
  { id: 'agri-3', cropName: 'Soil Moisture', iconName: 'Droplets', statusLabel: 'Alert', statusColor: 'bg-caution/10 text-caution', message: 'Saturation at 95%. No irrigation needed.' },
  { id: 'agri-4', cropName: 'Insurance', iconName: 'ShieldCheck', statusLabel: 'Active', statusColor: 'bg-safe/10 text-safe', message: 'Active scheme available for your zone.' },
];

const SEED_AGRI_ACTIONS: AgricultureActionItem[] = [
  { id: 'aa-1', text: 'Clear field drainage channels immediately', order: 1 },
  { id: 'aa-2', text: 'Harvest mature crops if possible before Friday', order: 2 },
  { id: 'aa-3', text: 'Store seeds on elevated platforms', order: 3 },
  { id: 'aa-4', text: 'Move livestock to higher grazing grounds', order: 4 },
];

const SEED_AGRI_ZONES: AgricultureRiskZone[] = [
  { id: 'az-1', label: 'High Risk', riskLevel: 'CRITICAL', district: 'Colombo District, Zone A', details: 'Expected 3-4 days of flooding', accentColor: 'critical' },
  { id: 'az-2', label: 'Moderate Risk', riskLevel: 'MODERATE', district: 'Gampaha District', details: 'Expected 1-2 days of rainfall', accentColor: 'warning' },
  { id: 'az-3', label: 'Low Risk', riskLevel: 'LOW', district: 'Kandy District', details: 'Minimal flood risk. Monitor only.', accentColor: 'safe' },
];

const SEED_RECOVERY_PROGRESS: RecoveryProgressItem[] = [
  { id: 'rp-1', label: 'Road Access', percent: 85, color: 'bg-safe' },
  { id: 'rp-2', label: 'Power Supply', percent: 60, color: 'bg-caution' },
  { id: 'rp-3', label: 'Water Safety', percent: 40, color: 'bg-critical' },
  { id: 'rp-4', label: 'Shelter Capacity', percent: 92, color: 'bg-info' },
];

const SEED_RECOVERY_NEEDS: RecoveryCriticalNeed[] = [
  { id: 'rn-1', name: 'Drinking Water', urgency: 'CRITICAL' },
  { id: 'rn-2', name: 'Dry Rations', urgency: 'HIGH' },
  { id: 'rn-3', name: 'Clothing', urgency: 'LOW' },
];

const SEED_RECOVERY_UPDATES: RecoveryUpdate[] = [
  { id: 'ru-1', iconName: 'CheckCircle', title: 'Routes restored to Sector 4', time: 'Today at 14:30' },
  { id: 'ru-2', iconName: 'Truck', title: 'Relief supplies distributed to 500 families', time: 'Yesterday at 11:00' },
  { id: 'ru-3', iconName: 'Hammer', title: 'Reconstruction work begins at damaged homes', time: '2 days ago' },
];

const SEED_RECOVERY_RESOURCES: RecoveryResource[] = [
  { id: 'rr-1', name: 'Crisis Hotline', detail: '+94-11-2-345-678' },
  { id: 'rr-2', name: 'Medical Support', detail: 'Red Cross Centers' },
  { id: 'rr-3', name: 'Counseling Services', detail: 'Disaster Relief Desk' },
];

const SEED_LEARN_GUIDES: LearnGuide[] = [
  { id: 'lg-1', title: 'Flood Basics', iconName: 'Droplets', description: 'Understand how floods happen and identify warning signs.', accentColor: 'info', visible: true },
  { id: 'lg-2', title: 'Home Safety', iconName: 'Shield', description: 'Fortify your home against rising water levels.', accentColor: 'safe', visible: true },
  { id: 'lg-3', title: 'Electrical Safety', iconName: 'Zap', description: 'Prevent electrocution and fire hazards during rain.', accentColor: 'caution', visible: true },
  { id: 'lg-4', title: 'School Prep', iconName: 'BookOpen', description: "What to pack in your child's emergency bag.", accentColor: 'warning', visible: true },
];

const SEED_LEARN_TIPS: LearnTipSection[] = [
  { id: 'lt-1', title: 'Before Monsoon Season', tips: ['Clean gutters and drainage systems', 'Check roof integrity and seal leaks', 'Stock emergency supplies (3-day minimum)'] },
  { id: 'lt-2', title: 'During Heavy Rain', tips: ['Avoid flooded roads and low-lying areas', 'Move to higher ground if instructed', 'Keep phone charged and stay alert'] },
  { id: 'lt-3', title: 'After Flooding', tips: ['Wait for all-clear before returning', 'Document damage for insurance claims', 'Disinfect affected areas and boil water'] },
];

const SEED_WISDOM: FeaturedWisdom = {
  quote: '"When the frogs croak louder than usual in the evening, expect heavy rain by morning. Move your firewood to the loft. The kingfisher\'s call changes pitch when water levels rise."',
  source: '— Local Knowledge from Kalutara District, Sri Lanka',
  visible: true,
};

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

const SEED_SETTINGS: FrontendSettings = {
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
  broadcastFeed: SEED_BROADCASTS,
  addBroadcastItem: (item) => {
    set((s) => ({
      broadcastFeed: [{ ...item, id: `bf-${nextBroadcastId++}` }, ...s.broadcastFeed],
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  removeBroadcastItem: (id) => {
    set((s) => ({
      broadcastFeed: s.broadcastFeed.filter((b) => b.id !== id),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  toggleBroadcastItem: (id) => {
    set((s) => ({
      broadcastFeed: s.broadcastFeed.map((b) => b.id === id ? { ...b, active: !b.active } : b),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },

  // ── Dashboard Resources ──
  dashboardResources: SEED_RESOURCES,
  updateResource: (id, updates) => {
    set((s) => ({
      dashboardResources: s.dashboardResources.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },

  // ── Agriculture ──
  agricultureAdvisories: SEED_AGRI_ADVISORIES,
  updateAdvisory: (id, updates) => {
    set((s) => ({
      agricultureAdvisories: s.agricultureAdvisories.map((a) => a.id === id ? { ...a, ...updates } : a),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  agricultureActions: SEED_AGRI_ACTIONS,
  updateAction: (id, text) => {
    set((s) => ({
      agricultureActions: s.agricultureActions.map((a) => a.id === id ? { ...a, text } : a),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  agricultureZones: SEED_AGRI_ZONES,
  updateZone: (id, updates) => {
    set((s) => ({
      agricultureZones: s.agricultureZones.map((z) => z.id === id ? { ...z, ...updates } : z),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },

  // ── Recovery ──
  recoveryProgress: SEED_RECOVERY_PROGRESS,
  updateRecoveryProgress: (id, percent) => {
    set((s) => ({
      recoveryProgress: s.recoveryProgress.map((p) => p.id === id ? { ...p, percent: Math.max(0, Math.min(100, percent)) } : p),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  recoveryNeeds: SEED_RECOVERY_NEEDS,
  updateRecoveryNeed: (id, updates) => {
    set((s) => ({
      recoveryNeeds: s.recoveryNeeds.map((n) => n.id === id ? { ...n, ...updates } : n),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  recoveryUpdates: SEED_RECOVERY_UPDATES,
  addRecoveryUpdate: (item) => {
    set((s) => ({
      recoveryUpdates: [{ ...item, id: `ru-${nextRecoveryUpdateId++}` }, ...s.recoveryUpdates],
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  recoveryResources: SEED_RECOVERY_RESOURCES,

  // ── Learn Hub ──
  learnGuides: SEED_LEARN_GUIDES,
  updateLearnGuide: (id, updates) => {
    set((s) => ({
      learnGuides: s.learnGuides.map((g) => g.id === id ? { ...g, ...updates } : g),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  learnTips: SEED_LEARN_TIPS,
  updateLearnTips: (id, tips) => {
    set((s) => ({
      learnTips: s.learnTips.map((t) => t.id === id ? { ...t, tips } : t),
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  featuredWisdom: SEED_WISDOM,
  updateFeaturedWisdom: (updates) => {
    set((s) => ({
      featuredWisdom: { ...s.featuredWisdom, ...updates },
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },

  // ── Frontend Settings ──
  frontendSettings: SEED_SETTINGS,
  updateFrontendSettings: (updates) => {
    set((s) => ({
      frontendSettings: { ...s.frontendSettings, ...updates },
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  setPageVisibility: (page, visible) => {
    set((s) => ({
      frontendSettings: {
        ...s.frontendSettings,
        pageVisibility: { ...s.frontendSettings.pageVisibility, [page]: visible },
      },
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
  setSiteFloodMode: (mode) => {
    set((s) => ({
      frontendSettings: { ...s.frontendSettings, siteFloodMode: mode },
    }));
    void saveAdminControlState(pickPersistableState(get()));
  },
}));
