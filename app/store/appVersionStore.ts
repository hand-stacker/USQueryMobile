import AsyncStorage from '@react-native-async-storage/async-storage';
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
      partialize: (state) =>
        ({
          lastSeenVersion: state.lastSeenVersion,
          dismissedUpdateVersion: state.dismissedUpdateVersion,
        } as any),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

// Fallback manual hydration: read persisted AsyncStorage and apply values.
// Mirrors the other stores so a component can read the version synchronously
// and so _hasHydrated always flips true even if the persist rehydrate misses.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('app-version-storage');
    if (!raw) {
      useAppVersionStore.setState({ _hasHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw);
    const s = parsed?.state ?? parsed ?? {};
    const current = useAppVersionStore.getState();
    useAppVersionStore.setState({
      lastSeenVersion: current.lastSeenVersion ?? s.lastSeenVersion ?? null,
      dismissedUpdateVersion: current.dismissedUpdateVersion ?? s.dismissedUpdateVersion ?? null,
      _hasHydrated: true,
    });
  } catch (error) {
    console.error('Error hydrating app version:', error);
    useAppVersionStore.setState({ _hasHydrated: true });
  }
})();
