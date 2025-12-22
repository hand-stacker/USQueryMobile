import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage, } from '../services/zustandStorage';

type FavoritesState = {
  favorites: number[];
  _hasHydrated: boolean;
  addFavorite: (topicId: number) => void;
  removeFavorite: (topicId: number) => void;
  isFavorite: (topicId: number) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      _hasHydrated: false,

      addFavorite: (topicId) =>
        set((state) => {
          if (state.favorites.includes(topicId)) {
            return state;
          }
          state.favorites.push(topicId);
          return { favorites: state.favorites };
        }),

      removeFavorite: (topicId) =>
        set((state) => ({
          favorites: state.favorites.filter(id => id !== topicId),
        })),

      isFavorite: (topicId) => get().favorites.includes(topicId),

      clearFavorites: () => set({ favorites: [] }),
      
      onRehydrateStorage: () => {
        set((state) => ({
          _hasHydrated: true
        }))
      }
    }),
    {
      name: 'favorite-topics',
      storage: zustandStorage,
    }
  )
);
