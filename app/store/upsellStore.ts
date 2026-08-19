import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

interface UpsellState {
  // Epoch ms until which the subscription upsell modal is muted. 0 = never
  // snoozed. Set when the user dismisses ("Maybe Later"/close) or taps Upgrade.
  upsellSnoozedUntil: number;
  setUpsellSnoozedUntil: (ts: number) => void;
  // Lifetime count of bill/member/vote detail pages opened. The upsell stays
  // silent until this passes a threshold so a brand-new user gets to use the
  // app before being sold anything.
  upsellQualifyingViews: number;
  bumpUpsellQualifyingViews: () => void;
  _hasHydrated: boolean;
}

export const useUpsellStore = create<UpsellState>()(
  persist(
    (set) => ({
      upsellSnoozedUntil: 0,
      setUpsellSnoozedUntil: (ts: number) => set({ upsellSnoozedUntil: ts }),
      upsellQualifyingViews: 0,
      bumpUpsellQualifyingViews: () =>
        set((s) => ({ upsellQualifyingViews: s.upsellQualifyingViews + 1 })),
      _hasHydrated: false,
    }),
    {
      name: 'upsell-storage',
      storage: zustandStorage as any,
      partialize: (state) =>
        ({
          upsellSnoozedUntil: state.upsellSnoozedUntil,
          upsellQualifyingViews: state.upsellQualifyingViews,
        } as any),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

// Fallback manual hydration: read persisted AsyncStorage and apply values, so
// the snooze timestamp is available synchronously and _hasHydrated always flips
// true even if the persist rehydrate misses. Mirrors appVersionStore.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('upsell-storage');
    if (!raw) {
      useUpsellStore.setState({ _hasHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw);
    const s = parsed?.state ?? parsed ?? {};
    const current = useUpsellStore.getState();
    useUpsellStore.setState({
      upsellSnoozedUntil: current.upsellSnoozedUntil || (s.upsellSnoozedUntil ?? 0),
      upsellQualifyingViews:
        current.upsellQualifyingViews || (s.upsellQualifyingViews ?? 0),
      _hasHydrated: true,
    });
  } catch (error) {
    console.error('Error hydrating upsell store:', error);
    useUpsellStore.setState({ _hasHydrated: true });
  }
})();
