import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

interface AppSettingsState {
  privacyAccepted: boolean;
  setPrivacyAccepted: (accepted: boolean) => void;
  disclaimerAccepted: boolean;
  setDisclaimerAccepted: (accepted: boolean) => void;
  reviewStatus: 'pending' | 'never' | 'reviewed';
  setReviewStatus: (status: 'pending' | 'never' | 'reviewed') => void;
  reviewCountdown: number;
  setReviewCountdown: (count: number) => void;
  _hasHydrated: boolean;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      privacyAccepted: false,
      setPrivacyAccepted: (accepted: boolean) => set({ privacyAccepted: accepted }),
      disclaimerAccepted: false,
      setDisclaimerAccepted: (accepted: boolean) => set({ disclaimerAccepted: accepted }),
      reviewStatus: 'pending',
      setReviewStatus: (status) => set({ reviewStatus: status }),
      reviewCountdown: 2,
      setReviewCountdown: (count) => set({ reviewCountdown: count }),
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
    const s = parsed?.state ?? parsed ?? {};
    const current = useAppSettingsStore.getState();
    useAppSettingsStore.setState({
      privacyAccepted: current.privacyAccepted || (s.privacyAccepted ?? false),
      disclaimerAccepted: current.disclaimerAccepted || (s.disclaimerAccepted ?? false),
      reviewStatus: s.reviewStatus ?? current.reviewStatus,
      reviewCountdown: s.reviewCountdown ?? current.reviewCountdown,
      _hasHydrated: true,
    });
  } catch (error) {
    console.error('Error hydrating app settings:', error);
    useAppSettingsStore.setState({ _hasHydrated: true });
  }
})();