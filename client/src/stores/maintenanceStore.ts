import { create } from 'zustand';
import {
  saveMaintenanceState,
  fetchEmergencyContacts,
  createEmergencyContact as apiCreateEmergencyContact,
  updateEmergencyContact as apiUpdateEmergencyContact,
  deleteEmergencyContact as apiDeleteEmergencyContact,
  fetchMapMarkers,
  createMapMarker as apiCreateMapMarker,
  updateMapMarker as apiUpdateMapMarker,
  deleteMapMarker as apiDeleteMapMarker,
  activateUser as apiActivateUser,
  suspendUserApi as apiSuspendUser,
  deleteUserApi as apiDeleteUser,
  fetchUsers as apiFetchUsers,
} from '../services/integrationApi';
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

// ═══ Default Configuration ═══

const SEED_EVACUATION: EvacuationRoute[] = [];

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
  loadEmergencyContacts: () => Promise<void>;
  loadMapMarkers: () => Promise<void>;
  loadUsers: () => Promise<void>;

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
  userActionLoading: string | null;
  userActionError: string | null;
  suspendUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

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
    mapZones: state.mapZones,
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
    const source = incoming as Partial<ReturnType<typeof pickPersistableState>> & {
      emergencyContacts?: EmergencyContact[];
      mapMarkers?: AdminMapMarker[];
    };
    set((state) => ({
      emergencyContacts: source.emergencyContacts ?? state.emergencyContacts,
      mapZones: source.mapZones || state.mapZones,
      mapMarkers: source.mapMarkers ?? state.mapMarkers,
      chatbotKnowledge: source.chatbotKnowledge || state.chatbotKnowledge,
      users: source.users || state.users,
      systemSettings: source.systemSettings || state.systemSettings,
      historyData: source.historyData || state.historyData,
      evacuationRoutes: source.evacuationRoutes || state.evacuationRoutes,
      simulationDefaults: source.simulationDefaults || state.simulationDefaults,
      dashboardOverrides: source.dashboardOverrides || state.dashboardOverrides,
    }));
  },

  loadEmergencyContacts: async () => {
    try {
      const contacts = await fetchEmergencyContacts();
      set({ emergencyContacts: contacts });
    } catch (error) {
      console.warn('Failed to load emergency contacts from backend:', error);
    }
  },

  loadMapMarkers: async () => {
    try {
      const markers = await fetchMapMarkers();
      set({ mapMarkers: markers });
    } catch (error) {
      console.warn('Failed to load map markers from backend:', error);
    }
  },

  loadUsers: async () => {
    try {
      const response = await apiFetchUsers(1, 100);
      const mapped = response.items.map((u) => ({
        id: u.id,
        userId: u.public_id || u.id,
        name: u.full_name,
        district: u.district_id || 'Unassigned',
        trustScore: u.trust_score,
        reportCount: u.report_count,
        status: u.status === 'pending' ? ('active' as const) : u.status,
        joinedAt: new Date(u.created_at).getTime(),
        lastActive: u.last_login_at ? new Date(u.last_login_at).getTime() : new Date(u.updated_at).getTime(),
      }));
      set({ users: mapped });
    } catch (error) {
      console.warn('Failed to load users from backend:', error);
    }
  },

  // ── Emergency Contacts ──
  emergencyContacts: [],
  addEmergencyContact: (contact) => {
    const optimisticId = genId('ec-temp');
    const optimisticContact: EmergencyContact = { ...contact, id: optimisticId };
    set((s) => ({ emergencyContacts: [...s.emergencyContacts, optimisticContact] }));

    void apiCreateEmergencyContact(contact)
      .then((savedContact) => {
        set((s) => ({
          emergencyContacts: s.emergencyContacts.map((item) =>
            item.id === optimisticId ? savedContact : item
          ),
        }));
        // CRITICAL FIX #1: Re-sync all contacts from backend to ensure consistency
        // This prevents ID mismatches between optimistic and actual server IDs
        void get().loadEmergencyContacts();
      })
      .catch((error) => {
        console.warn('Failed to create emergency contact in backend:', error);
        set((s) => ({ emergencyContacts: s.emergencyContacts.filter((item) => item.id !== optimisticId) }));
      });
  },
  updateEmergencyContact: (id, updates) => {
    const previous = get().emergencyContacts.find((c) => c.id === id);
    set((s) => ({ emergencyContacts: s.emergencyContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));

    void apiUpdateEmergencyContact(id, updates)
      .then((savedContact) => {
        set((s) => ({
          emergencyContacts: s.emergencyContacts.map((c) => (c.id === id ? savedContact : c)),
        }));
        // CRITICAL FIX #1: Reload to ensure state consistency with server
        void get().loadEmergencyContacts();
      })
      .catch((error) => {
        console.warn('Failed to update emergency contact in backend:', error);
        if (previous) {
          set((s) => ({
            emergencyContacts: s.emergencyContacts.map((c) => (c.id === id ? previous : c)),
          }));
        }
      });
  },
  removeEmergencyContact: (id) => {
    const removed = get().emergencyContacts.find((c) => c.id === id);
    set((s) => ({ emergencyContacts: s.emergencyContacts.filter((c) => c.id !== id) }));

    void apiDeleteEmergencyContact(id)
      .then(() => {
        // CRITICAL FIX #1: Reload to ensure state consistency with server
        void get().loadEmergencyContacts();
      })
      .catch((error) => {
        console.warn('Failed to delete emergency contact in backend:', error);
        if (removed) {
          set((s) => ({ emergencyContacts: [...s.emergencyContacts, removed] }));
      }
    });
  },

  // ── Map Management ──
  mapZones: [
    {
      id: 'mz-1',
      name: 'Colombo District, Western',
      zoneType: 'critical' as const,
      description: 'Highest flood risk. Major rivers: Kelani, Attanagalu, Bolgoda Lake. Monsoon season critical.',
      visible: true,
    },
    {
      id: 'mz-2',
      name: 'Gampaha District, Western',
      zoneType: 'high-risk' as const,
      description: 'Urban expansion increased flooding. Dual monsoons affect. Major rivers: Negombo Lagoon, Attanagalu.',
      visible: true,
    },
    {
      id: 'mz-3',
      name: 'Kalutara District, Western',
      zoneType: 'high-risk' as const,
      description: 'Coastal district vulnerable to both monsoons and storm surges. Kalutara River flashfloods common.',
      visible: true,
    },
    {
      id: 'mz-4',
      name: 'Batticaloa District, Eastern',
      zoneType: 'critical' as const,
      description: 'High monsoon risk. Batticaloa Lagoon overflow during heavy rains. Rural agriculture heavily impacted.',
      visible: true,
    },
    {
      id: 'mz-5',
      name: 'Kandy District, Central',
      zoneType: 'high-risk' as const,
      description: 'Mountainous terrain causes landslides and flashfloods. Tea plantations vulnerable. Mahaweli River key risk.',
      visible: true,
    },
    {
      id: 'mz-6',
      name: 'Matara District, Southern',
      zoneType: 'high-risk' as const,
      description: 'Southwest monsoon directly impacts. Nilwala River prone to overflow. Coastal erosion during floods.',
      visible: true,
    },
    {
      id: 'mz-7',
      name: 'Galle District, Southern',
      zoneType: 'high-risk' as const,
      description: 'Coastal vulnerability. Flash floods in low-lying coastal areas. Tourism infrastructure at risk.',
      visible: true,
    },
    {
      id: 'mz-8',
      name: 'Hambantota District, Southern',
      zoneType: 'safe' as const,
      description: 'Relatively dry region but monsoon season still requires monitoring. Port infrastructure risk.',
      visible: true,
    },
    {
      id: 'mz-9',
      name: 'Jaffna District, Northern',
      zoneType: 'safe' as const,
      description: 'Semi-arid climate. Minimal flooding but lagoons require careful management during monsoons.',
      visible: true,
    },
    {
      id: 'mz-10',
      name: 'Vavuniya District, Northern',
      zoneType: 'safe' as const,
      description: 'Inland district with moderate water retention. Post-war infrastructure recovery underway.',
      visible: true,
    },
    {
      id: 'mz-11',
      name: 'Kurunegala District, North Western',
      zoneType: 'high-risk' as const,
      description: 'Dual monsoon effects. Major reservoirs and irrigation systems. Chandrika Samudra lake management critical.',
      visible: true,
    },
    {
      id: 'mz-12',
      name: 'Puttalam District, North Western',
      zoneType: 'high-risk' as const,
      description: 'Lagoon-based district prone to overflow. Illegal sand mining affected natural barriers. Climate refugee area.',
      visible: true,
    },
    {
      id: 'mz-13',
      name: 'Anuradhapura District, North Central',
      zoneType: 'safe' as const,
      description: 'Ancient tank irrigation system. Dry zone requires flood management during monsoon transition periods.',
      visible: true,
    },
    {
      id: 'mz-14',
      name: 'Polonnaruwa District, North Central',
      zoneType: 'safe' as const,
      description: 'Historical flood management systems. Large tanks regulate water. Agriculture-dependent economy.',
      visible: true,
    },
    {
      id: 'mz-15',
      name: 'Badulla District, Uva',
      zoneType: 'high-risk' as const,
      description: 'Hill country elevation. Tea plantations vulnerable. Flashfloods in valleys. Steep slopes cause landslides.',
      visible: true,
    },
    {
      id: 'mz-16',
      name: 'Monaragala District, Uva',
      zoneType: 'safe' as const,
      description: 'Rural district with valley drainage challenges. Agricultural communities vulnerable to seasonal floods.',
      visible: true,
    },
    {
      id: 'mz-17',
      name: 'Ratnapura District, Sabaragamuwa',
      zoneType: 'high-risk' as const,
      description: 'Gemstone mining areas prone to flooding. Hill terrain causes rapid runoff. Gem industry dependent on water.',
      visible: true,
    },
    {
      id: 'mz-18',
      name: 'Kegalle District, Sabaragamuwa',
      zoneType: 'high-risk' as const,
      description: 'Tea country with plantation flooding risk. Steep terrain and deforestation increase vulnerability.',
      visible: true,
    },
    {
      id: 'mz-19',
      name: 'Matale District, Central',
      zoneType: 'high-risk' as const,
      description: 'Dry zone transition. Irrigation dependency. Upper Mahaweli basin affects. Landslide risk in hills.',
      visible: true,
    },
    {
      id: 'mz-20',
      name: 'Nuwara Eliya District, Central',
      zoneType: 'safe' as const,
      description: 'Highest elevation district. Cool climate. Water sources for downstream regions. Dam management critical.',
      visible: true,
    },
  ],
  updateMapZone: (id, updates) => {
    set((s) => ({ mapZones: s.mapZones.map((z) => (z.id === id ? { ...z, ...updates } : z)) }));
    void saveMaintenanceState(pickPersistableState(get()));
  },
  mapMarkers: [],
  updateMapMarker: (id, updates) => {
    const previous = get().mapMarkers.find((m) => m.id === id);
    set((s) => ({ mapMarkers: s.mapMarkers.map((m) => (m.id === id ? { ...m, ...updates } : m)) }));

    void apiUpdateMapMarker(id, updates)
      .then((savedMarker) => {
        set((s) => ({
          mapMarkers: s.mapMarkers.map((m) => (m.id === id ? savedMarker : m)),
        }));
      })
      .catch((error) => {
        console.warn('Failed to update map marker in backend:', error);
        if (previous) {
          set((s) => ({
            mapMarkers: s.mapMarkers.map((m) => (m.id === id ? previous : m)),
          }));
        }
      });
  },
  addMapMarker: (marker) => {
    const optimisticId = genId('mm-temp');
    const optimisticMarker: AdminMapMarker = { ...marker, id: optimisticId };
    set((s) => ({ mapMarkers: [...s.mapMarkers, optimisticMarker] }));

    void apiCreateMapMarker(marker)
      .then((savedMarker) => {
        set((s) => ({
          mapMarkers: s.mapMarkers.map((m) => (m.id === optimisticId ? savedMarker : m)),
        }));
      })
      .catch((error) => {
        console.warn('Failed to create map marker in backend:', error);
        set((s) => ({ mapMarkers: s.mapMarkers.filter((m) => m.id !== optimisticId) }));
      });
  },
  removeMapMarker: (id) => {
    const removed = get().mapMarkers.find((m) => m.id === id);
    set((s) => ({ mapMarkers: s.mapMarkers.filter((m) => m.id !== id) }));

    void apiDeleteMapMarker(id).catch((error) => {
      console.warn('Failed to delete map marker in backend:', error);
      if (removed) {
        set((s) => ({ mapMarkers: [...s.mapMarkers, removed] }));
      }
    });
  },

  // ── Chatbot Knowledge ──
  chatbotKnowledge: [],
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
  users: [],
  userActionError: null as string | null,
  userActionLoading: null as string | null,
  suspendUser: async (id) => {
    set({ userActionLoading: id, userActionError: null });
    try {
      await apiSuspendUser(id);
      // Reload users from backend to get authoritative state
      await get().loadUsers();
      set({ userActionLoading: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to suspend user';
      set({ userActionError: errorMsg, userActionLoading: null });
      console.error('Error suspending user:', error);
    }
  },
  activateUser: async (id) => {
    set({ userActionLoading: id, userActionError: null });
    try {
      await apiActivateUser(id);
      // Reload users from backend to get authoritative state
      await get().loadUsers();
      set({ userActionLoading: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to activate user';
      set({ userActionError: errorMsg, userActionLoading: null });
      console.error('Error activating user:', error);
    }
  },
  deleteUser: async (id) => {
    set({ userActionLoading: id, userActionError: null });
    try {
      await apiDeleteUser(id);
      // Reload users from backend to get authoritative state
      await get().loadUsers();
      set({ userActionLoading: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete user';
      set({ userActionError: errorMsg, userActionLoading: null });
      console.error('Error deleting user:', error);
    }
  },

  // ── System Settings ──
  systemSettings: {
    defaultMapCenter: [7.8731, 80.7718],
    defaultMapZoom: 8,
    riskThresholds: { critical: 80, high: 60, moderate: 40 },
    alertMessages: {
      critical: 'CRITICAL: Immediate evacuation required in affected areas.',
      high: 'HIGH ALERT: Prepare for possible evacuation.',
      moderate: 'MODERATE: Monitor water levels and stay alert.',
      safe: 'All clear. No immediate flood risk detected.',
    },
  },
  updateSystemSettings: (updates) => {
    set((s) => ({ systemSettings: { ...s.systemSettings, ...updates } }));
    void saveMaintenanceState(pickPersistableState(get()));
  },

  // ── History ──
  historyData: [
    { id: 'fh-1', year: 2024, floods: 12, rainfall: 450, description: 'Southwest monsoon with multiple river overflows. Colombo and Gampaha districts severely affected. 15,000 evacuated.' },
    { id: 'fh-2', year: 2023, floods: 8, rainfall: 320, description: 'Two-week downpour in May-June. Tea country landslides. Kandy district declared disaster area.' },
    { id: 'fh-3', year: 2022, floods: 14, rainfall: 520, description: 'Consecutive cyclones in October. Heavy flooding in Eastern and Northern provinces. 45,000+ affected.' },
    { id: 'fh-4', year: 2021, floods: 9, rainfall: 280, description: 'Localized flooding in Western province. Batticaloa district experienced river breach.' },
    { id: 'fh-5', year: 2020, floods: 11, rainfall: 380, description: 'Extended Southwest monsoon. Agriculture sector losses estimated at $2.5 billion.' },
    { id: 'fh-6', year: 2019, floods: 7, rainfall: 220, description: 'Minor flooding during April showers. Quick recovery with minimal economic impact.' },
    { id: 'fh-7', year: 2018, floods: 15, rainfall: 580, description: 'Worst monsoon season in 20 years. Nationwide disaster response activated. 200+ deaths.' },
    { id: 'fh-8', year: 2017, floods: 5, rainfall: 150, description: 'Dry monsoon period. Below-average rainfall. Drought conditions in some areas.' },
    { id: 'fh-9', year: 2016, floods: 9, rainfall: 340, description: 'Flash flooding in central highlands. Multiple landslides. Infrastructure damage widespread.' },
    { id: 'fh-10', year: 2015, floods: 6, rainfall: 280, description: 'Moderate monsoon activity. Foreseeable flooding managed well through early warnings.' },
    { id: 'fh-11', year: 2014, floods: 13, rainfall: 490, description: 'Unexpected early monsoon onset. Emergency preparations inadequate. $1.8B in damages.' },
    { id: 'fh-12', year: 2013, floods: 8, rainfall: 310, description: 'Normal monsoon season. Organized response protocols tested and validated.' },
    { id: 'fh-13', year: 2012, floods: 10, rainfall: 420, description: 'Erratic rainfall patterns. Sudden urban flooding. Water management infrastructure overwhelmed.' },
    { id: 'fh-14', year: 2011, floods: 7, rainfall: 260, description: 'Below-average season. Agriculture required irrigation support despite flooding in some pockets.' },
    { id: 'fh-15', year: 2010, floods: 14, rainfall: 550, description: 'Record rainfall recorded. Most severe season since 2003. National disaster declared.' },
    { id: 'fh-16', year: 2009, floods: 6, rainfall: 190, description: 'Dry year. Groundwater levels depleted. Managed through reservoirs and water imports.' },
    { id: 'fh-17', year: 2008, floods: 11, rainfall: 380, description: 'Extended post-war recovery period. Floods complicated reconstruction efforts significantly.' },
    { id: 'fh-18', year: 2007, floods: 9, rainfall: 330, description: 'Moderate activity. Post-conflict areas vulnerable due to weak drainage infrastructure.' },
    { id: 'fh-19', year: 2006, floods: 8, rainfall: 300, description: 'Ongoing conflict limited relief operations. Civilian casualties higher than expected.' },
    { id: 'fh-20', year: 2005, floods: 10, rainfall: 400, description: 'Concurrent with tsunami recovery. Double disaster compounded humanitarian crisis.' },
  ],
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
  evacuationRoutes: [
    {
      id: 'route-1',
      name: 'Colombo North Emergency Route',
      from: 'Colombo City Center',
      to: 'Negombo Sanctuary',
      distance: '35 km',
      status: 'active',
      path: [[6.9271, 80.6393], [6.9500, 80.7000], [7.2000, 80.7500]],
    },
    {
      id: 'route-2',
      name: 'Gampaha Western Route',
      from: 'Gampaha Town',
      to: 'Kurunegala Safe Zone',
      distance: '42 km',
      status: 'active',
      path: [[7.0833, 80.7500], [7.1000, 80.6000], [7.2800, 80.6350]],
    },
    {
      id: 'route-3',
      name: 'Kalutara Southern Route',
      from: 'Kalutara District',
      to: 'Matara Higher Ground',
      distance: '28 km',
      status: 'active',
      path: [[6.5910, 80.3546], [6.6500, 80.3000], [5.9497, 80.5353]],
    },
    {
      id: 'route-4',
      name: 'Batticaloa Eastward Route',
      from: 'Batticaloa Lagoon Area',
      to: 'Trincomalee Shelter',
      distance: '55 km',
      status: 'caution',
      path: [[7.7097, 81.7926], [7.9000, 81.8000], [8.5500, 81.1833]],
    },
    {
      id: 'route-5',
      name: 'Kandy Highland Route',
      from: 'Kandy City',
      to: 'Nuwara Eliya Hill Sanctuary',
      distance: '65 km',
      status: 'active',
      path: [[7.2906, 80.6337], [7.1500, 80.7800], [6.9497, 80.7778]],
    },
    {
      id: 'route-6',
      name: 'Galle South Coast Route',
      from: 'Galle Fort Area',
      to: 'Mirissa Elevated Zone',
      distance: '22 km',
      status: 'blocked',
      path: [[6.0535, 80.2172], [5.9500, 80.4500]],
    },
    {
      id: 'route-7',
      name: 'Batticaloa Alternative North Route',
      from: 'Batticaloa Town',
      to: 'Ampara Safe Corridor',
      distance: '38 km',
      status: 'active',
      path: [[7.7097, 81.7926], [7.6500, 81.6000], [7.0000, 81.3000]],
    },
    {
      id: 'route-8',
      name: 'Jaffna Northern Safe Route',
      from: 'Jaffna Peninsula',
      to: 'Vavuniya Shelter',
      distance: '125 km',
      status: 'active',
      path: [[9.6667, 80.1333], [9.0000, 80.3000], [8.7603, 80.8042]],
    },
  ],
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

void useMaintenanceStore.getState().loadEmergencyContacts();
void useMaintenanceStore.getState().loadMapMarkers();
