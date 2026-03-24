import { create } from 'zustand';
import { fetchEmergencyContacts, createEmergencyContact, updateEmergencyContact, deleteEmergencyContact, EmergencyContactPayload, EmergencyContactCreatePayload, EmergencyContactUpdatePayload } from '../services/integrationApi';

interface ContactsStore {
  contacts: EmergencyContactPayload[];
  loading: boolean;
  loadContacts: () => Promise<void>;
  addContact: (contact: EmergencyContactCreatePayload) => Promise<void>;
  updateContact: (id: string, updates: EmergencyContactUpdatePayload) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: [],
  loading: false,
  loadContacts: async () => {
    set({ loading: true });
    try {
      const data = await fetchEmergencyContacts();
      set({ contacts: data, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },
  addContact: async (contact) => {
    // Optimistic payload (real id populated by server)
    const optimistic = { ...contact, id: `temp-${Date.now()}` };
    set((s) => ({ contacts: [...s.contacts, optimistic] }));
    try {
      await createEmergencyContact(contact);
      await get().loadContacts();
    } catch (e) {
      console.error(e);
      set((s) => ({ contacts: s.contacts.filter((c) => c.id !== optimistic.id) }));
    }
  },
  updateContact: async (id, updates) => {
    const prev = get().contacts;
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    try {
      await updateEmergencyContact(id, updates);
      await get().loadContacts();
    } catch (e) {
      console.error(e);
      set({ contacts: prev });
    }
  },
  removeContact: async (id) => {
    const prev = get().contacts;
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
    try {
      await deleteEmergencyContact(id);
      await get().loadContacts();
    } catch (e) {
      console.error(e);
      set({ contacts: prev });
    }
  }
}));
