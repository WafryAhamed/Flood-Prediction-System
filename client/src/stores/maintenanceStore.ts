import { create } from 'zustand';
import { saveMaintenanceState } from '../services/integrationApi';
import type {
  EmergencyContact,
  AdminMapZone,
  AdminMapMarker,
  ChatbotKnowledgeEntry,
  SystemUser,
  SystemSettings,
  FloodHistoryEntry,
  EvacuationRoute,
  SimulationDefaults,
  DashboardOverrides,
} from '../types/admin';

// ═══ Seed Data ═══

const SEED_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'ec-1', label: 'Emergency Hotline', number: '112', type: 'police', active: true },
  { id: 'ec-2', label: 'Police', number: '119', type: 'police', active: true },
  { id: 'ec-3', label: 'Ambulance / Fire', number: '110', type: 'ambulance', active: true },
  { id: 'ec-4', label: 'Disaster Management Centre', number: '117', type: 'disaster', active: true },
];

const SEED_MAP_ZONES: AdminMapZone[] = [
  {
    id: 'mz-1',
    name: 'Kelani River Basin',
    zoneType: 'critical',
    description: 'Evacuate Immediately — Critical flood zone',
    visible: true,
    polygon: [[6.93, 79.85], [6.95, 79.90], [6.98, 79.92], [7.00, 79.88], [6.97, 79.84], [6.93, 79.85]],
  },
  {
    id: 'mz-2',
    name: 'Kalu Ganga Basin',
    zoneType: 'high-risk',
    description: 'Prepare for evacuation — High risk',
    visible: true,
    polygon: [[6.65, 80.35], [6.70, 80.42], [6.72, 80.40], [6.70, 80.33], [6.66, 80.32], [6.65, 80.35]],
  },
  {
    id: 'mz-3',
    name: 'Mihintale Highland',
    zoneType: 'safe',
    description: 'Safe zone — Highland area',
    visible: true,
    polygon: [[8.34, 80.48], [8.37, 80.52], [8.39, 80.51], [8.38, 80.47], [8.35, 80.46], [8.34, 80.48]],
  },
];

const SEED_MAP_MARKERS: AdminMapMarker[] = [
  { id: 'mm-1', label: 'Mihintale — Command Center', markerType: 'shelter', position: [8.3593, 80.5103], detail: 'Main coordination hub', visible: true },
  { id: 'mm-2', label: 'Anuradhapura Hospital', markerType: 'hospital', position: [8.3114, 80.4037], detail: 'District General Hospital — 500 beds', visible: true },
  { id: 'mm-3', label: 'Colombo Shelter', markerType: 'shelter', position: [6.9271, 79.8612], detail: 'Emergency Shelter — Capacity 2,000', visible: true },
  { id: 'mm-4', label: 'Ratnapura Flood Report', markerType: 'report', position: [6.6828, 80.3964], detail: 'Water level rising — 1.8 m above normal', visible: true },
  { id: 'mm-5', label: 'Kandy General Hospital', markerType: 'hospital', position: [7.2906, 80.6337], detail: 'Teaching Hospital — 1,200 beds', visible: true },
  { id: 'mm-6', label: 'Dambulla Shelter', markerType: 'shelter', position: [7.8731, 80.6517], detail: 'Safe zone shelter — Capacity 800', visible: true },
];

const SEED_CHATBOT_KNOWLEDGE: ChatbotKnowledgeEntry[] = [
  { id: 'ck-1', category: 'Danger Assessment', keywords: ['danger', 'risk', 'safe', 'am i'], response: 'If water levels are rising near you, move to higher ground immediately. Avoid flooded roads and stay away from rivers. Call the Disaster Management Centre at 117 for live updates.', active: true },
  { id: 'ck-2', category: 'Emergency Numbers', keywords: ['emergency', 'number', 'hotline', 'call', 'phone', 'contact'], response: 'Emergency Hotline: 112 | Police: 119 | Ambulance/Fire: 110 | Disaster Management Centre (DMC): 117. Call 117 for flood-specific assistance.', active: true },
  { id: 'ck-3', category: 'Shelter Information', keywords: ['shelter', 'safe place', 'safe zone', 'relief', 'refuge'], response: 'Head to the nearest school, temple, or government building designated as a relief shelter. Follow evacuation signs and local authority directions. Carry water, medicine, and important documents.', active: true },
  { id: 'ck-4', category: 'Evacuation Guidance', keywords: ['evacuat', 'leave', 'move', 'escape', 'route'], response: 'Follow evacuation notices from local authorities. Move to higher ground or the nearest designated shelter. Carry essential documents, drinking water, medicine, and a flashlight.', active: true },
  { id: 'ck-5', category: 'Weather Information', keywords: ['weather', 'rain', 'monsoon', 'forecast', 'storm'], response: "Sri Lanka's southwest monsoon runs May–September and the northeast monsoon December–February. Flood risk is highest during these periods. Monitor the DMC (117) and local weather reports closely.", active: true },
  { id: 'ck-6', category: 'Home Protection', keywords: ['home', 'house', 'protect', 'sandbag', 'property'], response: 'Place sandbags around entry points and move valuables to upper floors. Turn off electricity if water enters your home. Seal ground-level doors and windows with plastic sheeting.', active: true },
  { id: 'ck-7', category: 'Flood Areas', keywords: ['area', 'district', 'prone', 'colombo', 'ratnapura'], response: 'High-risk flood districts include Colombo, Gampaha, Kalutara, Ratnapura, Matara, Galle, Anuradhapura, and Batticaloa. Residents in low-lying areas should monitor warnings closely.', active: true },
  { id: 'ck-8', category: 'Agriculture', keywords: ['farm', 'crop', 'agriculture', 'livestock', 'field'], response: 'Move livestock and seeds to higher ground immediately. Drain excess water from fields if possible. Document crop losses for insurance claims and contact your agricultural extension officer.', active: true },
];

const SEED_USERS: SystemUser[] = [
  { id: 'usr-1', userId: '#8492', name: 'Nimal Perera', district: 'Gampaha', trustScore: 92, reportCount: 14, status: 'active', joinedAt: Date.now() - 90 * 86400000, lastActive: Date.now() - 120000 },
  { id: 'usr-2', userId: '#3217', name: 'Kamani Silva', district: 'Colombo', trustScore: 87, reportCount: 8, status: 'active', joinedAt: Date.now() - 60 * 86400000, lastActive: Date.now() - 300000 },
  { id: 'usr-3', userId: '#5641', name: 'Ruwan Jayawardena', district: 'Gampaha', trustScore: 78, reportCount: 5, status: 'active', joinedAt: Date.now() - 45 * 86400000, lastActive: Date.now() - 480000 },
  { id: 'usr-4', userId: '#7823', name: 'Dilini Fernando', district: 'Colombo', trustScore: 95, reportCount: 22, status: 'active', joinedAt: Date.now() - 120 * 86400000, lastActive: Date.now() - 180000 },
  { id: 'usr-5', userId: '#2094', name: 'Saman Kumara', district: 'Colombo', trustScore: 81, reportCount: 3, status: 'active', joinedAt: Date.now() - 30 * 86400000, lastActive: Date.now() - 720000 },
  { id: 'usr-6', userId: '#4456', name: 'Priyani Bandara', district: 'Colombo', trustScore: 88, reportCount: 11, status: 'active', joinedAt: Date.now() - 75 * 86400000, lastActive: Date.now() - 600000 },
  { id: 'usr-7', userId: '#6190', name: 'Asanka Fonseka', district: 'Colombo', trustScore: 74, reportCount: 2, status: 'suspended', joinedAt: Date.now() - 15 * 86400000, lastActive: Date.now() - 86400000 },
  { id: 'usr-8', userId: '#9312', name: 'Nadeesha Gunasekara', district: 'Colombo', trustScore: 90, reportCount: 18, status: 'active', joinedAt: Date.now() - 100 * 86400000, lastActive: Date.now() - 60000 },
];

const SEED_SYSTEM_SETTINGS: SystemSettings = {
  defaultMapCenter: [7.8731, 80.7718],
  defaultMapZoom: 8,
  riskThresholds: { critical: 80, high: 60, moderate: 40 },
  alertMessages: {
    critical: 'CRITICAL: Immediate evacuation required in affected areas.',
    high: 'HIGH ALERT: Prepare for possible evacuation.',
    moderate: 'MODERATE: Monitor water levels and stay alert.',
    safe: 'All clear. No immediate flood risk detected.',
  },
};

const SEED_HISTORY: FloodHistoryEntry[] = [
  { id: 'fh-1', year: 2018, floods: 2, rainfall: 1200, description: 'Two localized flood events in western regions' },
  { id: 'fh-2', year: 2019, floods: 1, rainfall: 900, description: 'Single minor flood event in eastern coast' },
  { id: 'fh-3', year: 2020, floods: 3, rainfall: 1500, description: 'Recovery phase with moderate flood incidents' },
  { id: 'fh-4', year: 2021, floods: 4, rainfall: 1800, description: 'Increased frequency due to climate variability' },
  { id: 'fh-5', year: 2022, floods: 2, rainfall: 1100, description: 'Two localized flood events in coastal regions' },
  { id: 'fh-6', year: 2023, floods: 5, rainfall: 2100, description: 'Severe monsoon rainfall caused widespread flooding in urban areas' },
];

const SEED_EVACUATION: EvacuationRoute[] = [
  {
    id: 'er-1',
    name: 'Mihintale → Anuradhapura Hospital',
    from: 'Mihintale',
    to: 'Anuradhapura Hospital',
    distance: '12.4 km',
    status: 'active',
    path: [[8.3593, 80.5103], [8.3450, 80.4800], [8.3300, 80.4500], [8.3114, 80.4037]],
  },
  {
    id: 'er-2',
    name: 'Kelaniya → Colombo Shelter',
    from: 'Kelaniya',
    to: 'Colombo Central Shelter',
    distance: '8.2 km',
    status: 'active',
    path: [[6.9533, 79.9220], [6.9450, 79.9000], [6.9350, 79.8800], [6.9271, 79.8612]],
  },
  {
    id: 'er-3',
    name: 'Kaduwela → Malabe Heights',
    from: 'Kaduwela',
    to: 'Malabe Heights',
    distance: '5.6 km',
    status: 'caution',
    path: [[6.9310, 79.9830], [6.9350, 79.9650], [6.9400, 79.9450], [6.9500, 79.9300]],
  },
];

const SEED_SIMULATION: SimulationDefaults = {
  rainfall: 50,
  drainage: 50,
  urbanization: 50,
};

const SEED_DASHBOARD_OVERRIDES: DashboardOverrides = {
  windSpeed: null,
  rainfall: null,
  riskStatus: null,
};

// ═══ Store Interface ═══

interface MaintenanceStore {
  hydrateFromBackend: (state: Record<string, unknown>) => void;

  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateEmergencyContact: (id: string, updates: Partial<EmergencyContact>) => void;
  removeEmergencyContact: (id: string) => void;

  // Map Management
  mapZones: AdminMapZone[];
  updateMapZone: (id: string, updates: Partial<AdminMapZone>) => void;
  mapMarkers: AdminMapMarker[];
  updateMapMarker: (id: string, updates: Partial<AdminMapMarker>) => void;
  addMapMarker: (marker: Omit<AdminMapMarker, 'id'>) => void;
  removeMapMarker: (id: string) => void;

  // Chatbot Knowledge
  chatbotKnowledge: ChatbotKnowledgeEntry[];
  addKnowledgeEntry: (entry: Omit<ChatbotKnowledgeEntry, 'id'>) => void;
  updateKnowledgeEntry: (id: string, updates: Partial<ChatbotKnowledgeEntry>) => void;
  removeKnowledgeEntry: (id: string) => void;

  // Users
  users: SystemUser[];
  suspendUser: (id: string) => void;
  activateUser: (id: string) => void;
  deleteUser: (id: string) => void;

  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;

  // History
  historyData: FloodHistoryEntry[];
  updateHistoryEntry: (id: string, updates: Partial<FloodHistoryEntry>) => void;
  addHistoryEntry: (entry: Omit<FloodHistoryEntry, 'id'>) => void;
  removeHistoryEntry: (id: string) => void;

  // Evacuation
  evacuationRoutes: EvacuationRoute[];
  updateEvacuationRoute: (id: string, updates: Partial<EvacuationRoute>) => void;
  addEvacuationRoute: (route: Omit<EvacuationRoute, 'id'>) => void;
  removeEvacuationRoute: (id: string) => void;

  // Simulation
  simulationDefaults: SimulationDefaults;
  updateSimulationDefaults: (updates: Partial<SimulationDefaults>) => void;

  // Dashboard Overrides
  dashboardOverrides: DashboardOverrides;
  updateDashboardOverrides: (updates: Partial<DashboardOverrides>) => void;
}

let nextId = 200;
function genId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

function pickPersistableState(state: MaintenanceStore) {
  return {
    emergencyContacts: state.emergencyContacts,
    mapZones: state.mapZones,
    mapMarkers: state.mapMarkers,
    chatbotKnowledge: state.chatbotKnowledge,
    users: state.users,
    systemSettings: state.systemSettings,
    historyData: state.historyData,
    evacuationRoutes: state.evacuationRoutes,
    simulationDefaults: state.simulationDefaults,
    dashboardOverrides: state.dashboardOverrides,
  };
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  hydrateFromBackend: (incoming) => {
    const source = incoming as Partial<ReturnType<typeof pickPersistableState>>;
    set((state) => ({
      emergencyContacts: source.emergencyContacts || state.emergencyContacts,
      mapZones: source.mapZones || state.mapZones,
      mapMarkers: source.mapMarkers || state.mapMarkers,
      chatbotKnowledge: source.chatbotKnowledge || state.chatbotKnowledge,
      users: source.users || state.users,
      systemSettings: source.systemSettings || state.systemSettings,
      historyData: source.historyData || state.historyData,
      evacuationRoutes: source.evacuationRoutes || state.evacuationRoutes,
      simulationDefaults: source.simulationDefaults || state.simulationDefaults,
      dashboardOverrides: source.dashboardOverrides || state.dashboardOverrides,
    }));
  },

  // ── Emergency Contacts ──
  emergencyContacts: SEED_EMERGENCY_CONTACTS,
  addEmergencyContact: (contact) => {
    set((s) => ({ emergencyContacts: [...s.emergencyContacts, { ...contact, id: genId('ec') }] }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  updateEmergencyContact: (id, updates) => {
    set((s) => ({ emergencyContacts: s.emergencyContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  removeEmergencyContact: (id) => {
    set((s) => ({ emergencyContacts: s.emergencyContacts.filter((c) => c.id !== id) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Map Management ──
  mapZones: SEED_MAP_ZONES,
  updateMapZone: (id, updates) => {
    set((s) => ({ mapZones: s.mapZones.map((z) => (z.id === id ? { ...z, ...updates } : z)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  mapMarkers: SEED_MAP_MARKERS,
  updateMapMarker: (id, updates) => {
    set((s) => ({ mapMarkers: s.mapMarkers.map((m) => (m.id === id ? { ...m, ...updates } : m)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  addMapMarker: (marker) => {
    set((s) => ({ mapMarkers: [...s.mapMarkers, { ...marker, id: genId('mm') }] }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  removeMapMarker: (id) => {
    set((s) => ({ mapMarkers: s.mapMarkers.filter((m) => m.id !== id) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Chatbot Knowledge ──
  chatbotKnowledge: SEED_CHATBOT_KNOWLEDGE,
  addKnowledgeEntry: (entry) => {
    set((s) => ({ chatbotKnowledge: [...s.chatbotKnowledge, { ...entry, id: genId('ck') }] }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  updateKnowledgeEntry: (id, updates) => {
    set((s) => ({ chatbotKnowledge: s.chatbotKnowledge.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  removeKnowledgeEntry: (id) => {
    set((s) => ({ chatbotKnowledge: s.chatbotKnowledge.filter((e) => e.id !== id) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Users ──
  users: SEED_USERS,
  suspendUser: (id) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'suspended' as const } : u)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  activateUser: (id) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'active' as const } : u)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  deleteUser: (id) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'deleted' as const } : u)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── System Settings ──
  systemSettings: SEED_SYSTEM_SETTINGS,
  updateSystemSettings: (updates) => {
    set((s) => ({ systemSettings: { ...s.systemSettings, ...updates } }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── History ──
  historyData: SEED_HISTORY,
  updateHistoryEntry: (id, updates) => {
    set((s) => ({ historyData: s.historyData.map((h) => (h.id === id ? { ...h, ...updates } : h)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  addHistoryEntry: (entry) => {
    set((s) => ({ historyData: [...s.historyData, { ...entry, id: genId('fh') }] }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  removeHistoryEntry: (id) => {
    set((s) => ({ historyData: s.historyData.filter((h) => h.id !== id) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Evacuation ──
  evacuationRoutes: SEED_EVACUATION,
  updateEvacuationRoute: (id, updates) => {
    set((s) => ({ evacuationRoutes: s.evacuationRoutes.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  addEvacuationRoute: (route) => {
    set((s) => ({ evacuationRoutes: [...s.evacuationRoutes, { ...route, id: genId('er') }] }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  removeEvacuationRoute: (id) => {
    set((s) => ({ evacuationRoutes: s.evacuationRoutes.filter((r) => r.id !== id) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Simulation ──
  simulationDefaults: SEED_SIMULATION,
  updateSimulationDefaults: (updates) => {
    set((s) => ({ simulationDefaults: { ...s.simulationDefaults, ...updates } }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── Dashboard Overrides ──
  dashboardOverrides: SEED_DASHBOARD_OVERRIDES,
  updateDashboardOverrides: (updates) => {
    set((s) => ({ dashboardOverrides: { ...s.dashboardOverrides, ...updates } }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
}));
