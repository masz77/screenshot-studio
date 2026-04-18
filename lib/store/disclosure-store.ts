// lib/store/disclosure-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SectionState {
  open: boolean;
  advancedOpen: boolean;
}

interface DisclosureStore {
  sections: Record<string, SectionState>;
  setOpen: (sectionId: string, open: boolean) => void;
  setAdvancedOpen: (sectionId: string, open: boolean) => void;
  getSection: (sectionId: string, defaults: SectionState) => SectionState;
}

/**
 * Safe storage: falls back to an in-memory shim if localStorage is unavailable
 * (private tabs, quota exceeded, SSR). Never throws.
 */
const safeStorage = (): Storage => {
  if (typeof window === 'undefined') {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
      clear: () => memory.clear(),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() { return memory.size; },
    };
  }
  try {
    const testKey = '__disclosure_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
      clear: () => memory.clear(),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() { return memory.size; },
    };
  }
};

export const useDisclosureStore = create<DisclosureStore>()(
  persist(
    (set, get) => ({
      sections: {},
      setOpen: (sectionId, open) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: {
              open,
              advancedOpen: state.sections[sectionId]?.advancedOpen ?? false,
            },
          },
        })),
      setAdvancedOpen: (sectionId, advancedOpen) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [sectionId]: {
              open: state.sections[sectionId]?.open ?? true,
              advancedOpen,
            },
          },
        })),
      getSection: (sectionId, defaults) => {
        const entry = get().sections[sectionId];
        return entry ?? defaults;
      },
    }),
    {
      name: 'screenshot-studio:disclosure',
      storage: createJSONStorage(() => safeStorage()),
      version: 1,
    }
  )
);
