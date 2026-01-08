import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/zustandStorage';

type StarredMembersState = {
  stars: string[];
  _hasHydrated: boolean;
  addStar: (membershipId: string) => void;
  removeStar: (membershipId: string) => void;
  toggleStar: (membershipId: string) => void;
  isStarred: (membershipId: string) => boolean;
  setStars: (ids: string[]) => void;
  clearStars: () => void;
};

export const useStarredMembersStore = create<StarredMembersState>()(
  persist(
    (set, get) => ({
      stars: [],
      _hasHydrated: false,

      addStar: (membershipId: string) =>
        set((state) => {
          const id = String(membershipId);
          if (state.stars.includes(id)) return state;
          const next = [...state.stars, id];
          return { stars: next } as any;
        }),

      removeStar: (membershipId: string) =>
        set((state) => ({ stars: state.stars.filter((s) => s !== String(membershipId)) })),

      toggleStar: (membershipId: string) =>
        set((state) => {
          const id = String(membershipId);
          if (state.stars.includes(id)) {
            return { stars: state.stars.filter((s) => s !== id) } as any;
          }
          return { stars: [...state.stars, id] } as any;
        }),

      isStarred: (membershipId: string) => get().stars.includes(String(membershipId)),

      setStars: (ids: string[]) => set({ stars: ids.map((i) => String(i)) }),

      clearStars: () => set({ stars: [] }),
    }),
    {
      name: 'starred-members',
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

(async () => {
  try {
    const raw = await AsyncStorage.getItem('starred-members');
    if (!raw) {
      useStarredMembersStore.setState({ _hasHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw);
    const stars = parsed?.state?.stars ?? parsed?.stars ?? [];
    if (Array.isArray(stars) && stars.length > 0) {
      const current = useStarredMembersStore.getState().stars;
      if (!current || current.length === 0) {
        useStarredMembersStore.setState({ stars: stars.map((s: any) => String(s)), _hasHydrated: true });
      } else {
        useStarredMembersStore.setState({ _hasHydrated: true });
      }
    } else {
      useStarredMembersStore.setState({ _hasHydrated: true });
    }
  } catch (e) {
    useStarredMembersStore.setState({ _hasHydrated: true });
  }
})();
