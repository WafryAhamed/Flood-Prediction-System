import { create } from 'zustand';
import { fetchPageVisibility, updatePageVisibility } from '../services/integrationApi';

interface VisibilityStore {
  visibility: Record<string, boolean>;
  loading: boolean;
  loadVisibility: () => Promise<void>;
  toggleVisibility: (pageName: string, isEnabled: boolean) => Promise<void>;
}

export const useVisibilityStore = create<VisibilityStore>((set, get) => ({
  visibility: {},
  loading: false,
  loadVisibility: async () => {
    set({ loading: true });
    try {
      const data = await fetchPageVisibility();
      const map: Record<string, boolean> = {};
      data.forEach(item => { map[item.page_name] = item.is_enabled; });
      set({ visibility: map, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },
  toggleVisibility: async (pageName, isEnabled) => {
    const prev = get().visibility;
    // Optimistic UI update
    set({ visibility: { ...prev, [pageName]: isEnabled } });
    try {
      await updatePageVisibility(pageName, isEnabled);
    } catch (e) {
      console.error(e);
      // Revert on failure
      set({ visibility: prev });
    }
  }
}));
