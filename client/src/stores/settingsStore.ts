import { create } from 'zustand';
import { fetchSystemSettings, updateSystemSettings, SystemSettingsPayload } from '../services/integrationApi';

interface SettingsStore {
  settings: SystemSettingsPayload | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: (key: keyof SystemSettingsPayload, value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  loadSettings: async () => {
    set({ loading: true });
    try {
      const data = await fetchSystemSettings();
      set({ settings: data, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },
  updateSetting: async (key, value) => {
    let current = get().settings;
    if (!current) return;
    const nextSettings = { ...current, [key]: value };
    // Optimistic UI update
    set({ settings: nextSettings });
    try {
      const updated = await updateSystemSettings(nextSettings);
      set({ settings: updated });
    } catch (e) {
      console.error(e);
      // Revert on failure
      set({ settings: current });
    }
  }
}));
