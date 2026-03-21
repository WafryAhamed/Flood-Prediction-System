import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AdminCentralState {
  // Situation Room
  activeIncidents: number;
  highestSeverity: string;
  populationAtRisk: number;

  // Users
  users: Array<{
    userId: string;
    name: string;
    email: string;
    district: string;
    status: 'active' | 'suspended' | 'deleted';
    createdAt: number;
  }>;

  // Reports
  pendingReports: number;
  verifiedReports: number;
  resolvedReports: number;

  // Contacts
  emergencyContacts: Array<{
    id: string;
    label: string;
    number: string;
    type: string;
    active: boolean;
  }>;

  // Map Markers
  mapMarkers: Array<{
    id: string;
    label: string;
    markerType: string;
    position: [number, number];
    detail: string;
    visible: boolean;
  }>;

  // Weather
  weatherOverrides: {
    windSpeed: number | null;
    rainfall: number | null;
    temperature: number | null;
  };

  // UI State
  activeTab: string;
  selectedDistrict: string | null;
  mapZoom: number;
  sidebarOpen: boolean;

  // Actions
  setSituationRoom: (data: Partial<AdminCentralState>) => void;
  setUsers: (users: AdminCentralState['users']) => void;
  setEmergencyContacts: (contacts: AdminCentralState['emergencyContacts']) => void;
  setMapMarkers: (markers: AdminCentralState['mapMarkers']) => void;
  setWeatherOverrides: (overrides: Partial<AdminCentralState['weatherOverrides']>) => void;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  syncFromBootstrap: (data: any) => void;
  resetState: () => void;
}

const initialState: Omit<AdminCentralState, keyof {
  setSituationRoom: any;
  setUsers: any;
  setEmergencyContacts: any;
  setMapMarkers: any;
  setWeatherOverrides: any;
  setActiveTab: any;
  setSidebarOpen: any;
  syncFromBootstrap: any;
  resetState: any;
}> = {
  activeIncidents: 0,
  highestSeverity: 'LOW',
  populationAtRisk: 0,
  users: [],
  pendingReports: 0,
  verifiedReports: 0,
  resolvedReports: 0,
  emergencyContacts: [],
  mapMarkers: [],
  weatherOverrides: { windSpeed: null, rainfall: null, temperature: null },
  activeTab: 'situation',
  selectedDistrict: null,
  mapZoom: 7,
  sidebarOpen: false,
};

export const useAdminCentralStore = create<AdminCentralState>()(
  devtools((set) => ({
    ...initialState,

    setSituationRoom: (data) => set((state) => ({ ...state, ...data })),

    setUsers: (users) => set({ users }),

    setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),

    setMapMarkers: (markers) => set({ mapMarkers: markers }),

    setWeatherOverrides: (overrides) =>
      set((state) => ({
        weatherOverrides: { ...state.weatherOverrides, ...overrides },
      })),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    syncFromBootstrap: (data) =>
      set((state) => ({
        ...state,
        users: data.users || state.users,
        emergencyContacts: data.emergencyContacts || state.emergencyContacts,
        mapMarkers: data.mapMarkers || state.mapMarkers,
      })),

    resetState: () => set(initialState),
  })),
);
