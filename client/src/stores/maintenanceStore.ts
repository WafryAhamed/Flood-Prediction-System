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
  mapZones: [],
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
  historyData: [],
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
  evacuationRoutes: [],
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
