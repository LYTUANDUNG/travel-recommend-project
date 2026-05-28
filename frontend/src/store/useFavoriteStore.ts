import { create } from 'zustand';
import { api } from '../api';

interface FavoriteState {
  favorites: any[];
  loading: boolean;
  fetchFavorites: (userId: number) => Promise<void>;
  toggleFavorite: (userId: number, locationId: number) => Promise<boolean>;
  isFavorited: (locationId: number) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  loading: false,

  fetchFavorites: async (userId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await api.favorite.getByUser(userId);
      if (res.success) {
        set({ favorites: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  toggleFavorite: async (userId, locationId) => {
    const res = await api.favorite.toggle(userId, locationId);
    if (res.success) {
      // Refresh list after toggle
      const resList = await api.favorite.getByUser(userId);
      if (resList.success) {
        set({ favorites: resList.data });
      }
      return res.data; // New favorite status
    }
    return false;
  },

  isFavorited: (locationId) => {
    return get().favorites.some((f: any) => {
        const locId = f.location?.location_id || f.location?.locationId || f.locationId;
        return locId === locationId;
    });
  }
}));
