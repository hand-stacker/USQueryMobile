import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

interface AppSettingsState {
  privacyAccepted: boolean;
  setPrivacyAccepted: (accepted: boolean) => void;
  _hasHydrated: boolean;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      privacyAccepted: false,
      setPrivacyAccepted: (accepted: boolean) => set({ privacyAccepted: accepted }),
      _hasHydrated: false,
    }),
    {
      name: 'app-settings-storage',
      storage: zustandStorage as any,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

// Fallback manual hydration: read persisted AsyncStorage and apply settings
// This ensures the store has settings available synchronously for components
// that may render before the persist middleware finishes merging.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('app-settings-storage');
    if (!raw) {
      useAppSettingsStore.setState({ _hasHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw);
    const privacyAccepted = parsed?.state?.privacyAccepted ?? parsed?.privacyAccepted ?? false;
    const current = useAppSettingsStore.getState().privacyAccepted;
    if (current === false && privacyAccepted === true) {
      useAppSettingsStore.setState({ privacyAccepted: true, _hasHydrated: true });
    } else {
      useAppSettingsStore.setState({ _hasHydrated: true });
    }
  } catch (error) {
    console.error('Error hydrating app settings:', error);
    useAppSettingsStore.setState({ _hasHydrated: true });
  }
})();