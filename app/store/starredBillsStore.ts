import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

type StarredState = {
  stars: string[];
  _hasHydrated: boolean;
  addStar: (billId: string) => void;
  removeStar: (billId: string) => void;
  toggleStar: (billId: string) => void;
  isStarred: (billId: string) => boolean;
  setStars: (ids: string[]) => void;
  clearStars: () => void;
};

export const useStarredBillsStore = create<StarredState>()(
  persist(
    (set, get) => ({
      stars: [],
      _hasHydrated: false,

      addStar: (billId: string) =>
        set((state) => {
          const id = String(billId);
          if (state.stars.includes(id)) return state;
          const next = [...state.stars, id];
          return { stars: next } as any;
        }),

      removeStar: (billId: string) =>
        set((state) => ({ stars: state.stars.filter((s) => s !== String(billId)) })),

      toggleStar: (billId: string) =>
        set((state) => {
          const id = String(billId);
          if (state.stars.includes(id)) {
            return { stars: state.stars.filter((s) => s !== id) } as any;
          }
          return { stars: [...state.stars, id] } as any;
        }),

      isStarred: (billId: string) => get().stars.includes(String(billId)),

      setStars: (ids: string[]) => set({ stars: ids.map((i) => String(i)) }),

      clearStars: () => set({ stars: [] }),
    }),
    {
      name: 'starred-bills',
      storage: zustandStorage as any,
      partialize: (state) => ({ stars: state.stars } as any),
      onRehydrateStorage: () => (persistedState) => {
        if (persistedState) {
          (persistedState as any)._hasHydrated = true;
        }
      },
    }
  )
);

// Manual fallback hydration similar to other stores so components can read
// the starred list synchronously if needed.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('starred-bills');
    if (!raw) {
      useStarredBillsStore.setState({ _hasHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw);
    const stars = parsed?.state?.stars ?? parsed?.stars ?? [];
    if (Array.isArray(stars) && stars.length > 0) {
      const current = useStarredBillsStore.getState().stars;
      if (!current || current.length === 0) {
        useStarredBillsStore.setState({ stars: stars.map((s: any) => String(s)), _hasHydrated: true });
      } else {
        useStarredBillsStore.setState({ _hasHydrated: true });
      }
    } else {
      useStarredBillsStore.setState({ _hasHydrated: true });
    }
  } catch (e) {
    useStarredBillsStore.setState({ _hasHydrated: true });
  }
})();
