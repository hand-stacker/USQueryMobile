import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

interface AppVersionState {
  // Last installed app version the user has seen the What's New modal for.
  // null = fresh install / store never written.
  lastSeenVersion: string | null;
  setLastSeenVersion: (version: string) => void;
  // Latest available version the user dismissed the update prompt for —
  // re-prompts only when a newer version is released.
  dismissedUpdateVersion: string | null;
  setDismissedUpdateVersion: (version: string) => void;
  _hasHydrated: boolean;
}

export const useAppVersionStore = create<AppVersionState>()(
  persist(
    (set) => ({
      lastSeenVersion: null,
      setLastSeenVersion: (version: string) => set({ lastSeenVersion: version }),
      dismissedUpdateVersion: null,
      setDismissedUpdateVersion: (version: string) => set({ dismissedUpdateVersion: version }),
      _hasHydrated: false,
    }),
    {
      name: 'app-version-storage',
      storage: zustandStorage as any,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
