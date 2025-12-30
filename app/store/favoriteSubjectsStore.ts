import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist } from 'zustand/middleware';
import { zustandStorage, } from '../services/zustandStorage';

type FavoritesState = {
  favorites: number[];
  _hasHydrated: boolean;
  // welcomeCounter: 0 means show immediately; positive values are countdowns on app open
  welcomeCounter: number;
  addFavorite: (topicId: number) => void;
  setFavorites: (topicIds: number[]) => void;
  removeFavorite: (topicId: number) => void;
  isFavorite: (topicId: number) => boolean;
  clearFavorites: () => void;
  setWelcomeCounter: (n: number) => void;
  decrementWelcomeCounter: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      _hasHydrated: false,
      // -1 = unset (first open), 0 = open select modal immediately on open, >0 = countdown
      welcomeCounter: -1,

      addFavorite: (topicId) =>
        set((state) => {
          if (state.favorites.includes(topicId)) {
            return state;
          }
          state.favorites.push(topicId);
          return { favorites: state.favorites };
        }),

      setFavorites: (topicIds: number[]) =>
        set((state) => {
          const next = { favorites: topicIds } as any;
          // If favorites is not empty ensure welcomeCounter is 1 so modal can open immediately
          if (Array.isArray(topicIds) && topicIds.length > 0 && state.welcomeCounter !== 1) {
            next.welcomeCounter = 1;
          }
          return next;
        }),

      removeFavorite: (topicId) =>
        set((state) => ({
          favorites: state.favorites.filter(id => id !== topicId),
        })),

      setWelcomeCounter: (n: number) => set({ welcomeCounter: n }),

      decrementWelcomeCounter: () =>
        set((state) => ({ welcomeCounter: Math.max(0, (state.welcomeCounter ?? 0) - 1) })),

      isFavorite: (topicId) => get().favorites.includes(topicId),

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'favorite-topics',
      storage: zustandStorage as any,
      // Only persist the favorites array; don't persist the hydration flag
      partialize: (state) => ({ favorites: state.favorites, welcomeCounter: state.welcomeCounter } as any),
      // Before the persisted state is merged back into the store, mark it hydrated
      // so the UI doesn't see `_hasHydrated: false` coming from storage.
      onRehydrateStorage: () => (persistedState) => {
        if (persistedState) {
          // mutate the persisted snapshot so the merged state has `_hasHydrated: true`
          (persistedState as any)._hasHydrated = true;
        }
      }
    }
  )
);

// Fallback manual hydration: read persisted AsyncStorage and apply favorites
// This ensures the store has favorites available synchronously for components
// that may render before the persist middleware finishes merging.
(async () => {
  try {
    const raw = await AsyncStorage.getItem('favorite-topics');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const favs = parsed?.state?.favorites ?? parsed?.favorites ?? [];
    const counter = parsed?.state?.welcomeCounter ?? parsed?.welcomeCounter ?? undefined;
    if (Array.isArray(favs) && favs.length > 0) {
      // apply to store if not already set
      const current = useFavoritesStore.getState().favorites;
        if (!current || current.length === 0) {
        useFavoritesStore.setState({ favorites: favs, _hasHydrated: true, welcomeCounter: counter ?? -1 });
      } else {
        // still mark hydrated
        useFavoritesStore.setState({ _hasHydrated: true, welcomeCounter: counter ?? useFavoritesStore.getState().welcomeCounter ?? -1 });
      }
    } else {
      useFavoritesStore.setState({ _hasHydrated: true, welcomeCounter: counter ?? useFavoritesStore.getState().welcomeCounter ?? -1 });
    }
  } catch (e) {
    // ignore parse errors but mark hydrated so UI won't wait forever
    useFavoritesStore.setState({ _hasHydrated: true });
  }
})();
