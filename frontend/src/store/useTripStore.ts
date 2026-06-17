import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location } from '../types/schema';
import { api } from '../api';

interface TripItem {
  location_id: number;
  name: string;
  thumbnail_url?: string;
  order_index: number;
  visit_date?: string;
}

interface TripStore {
  tripItems: TripItem[];
  addItem: (location: Location) => void;
  removeItem: (locationId: number) => void;
  updateOrder: (items: TripItem[]) => void;
  clearTrip: () => void;
  syncToBackend: (userId: number) => Promise<void>;
  loadFromBackend: (userId: number) => Promise<void>;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      tripItems: [],
      
      addItem: (location: Location) => {
        const { tripItems } = get();
        if (tripItems.some(item => item.location_id === location.location_id)) return;
        
        const newItem: TripItem = {
          location_id: location.location_id,
          name: location.name,
          thumbnail_url: location.thumbnail_url || (location.images?.[0]),
          order_index: tripItems.length
        };
        
        set({ tripItems: [...tripItems, newItem] });
      },
      
      removeItem: (locationId: number) => {
        set({ tripItems: get().tripItems.filter(i => i.location_id !== locationId) });
      },
      
      updateOrder: (items: TripItem[]) => {
        set({ tripItems: items.map((item, idx) => ({ ...item, order_index: idx })) });
      },
      
      clearTrip: () => set({ tripItems: [] }),
      
      syncToBackend: async (userId: number) => {
        const { tripItems } = get();
        const payload = tripItems.map((item, index) => ({
          location_id: item.location_id,
          day: Number((item.visit_date || 'Ngày 1').replace(/\D/g, '')) || 1,
          order_index: item.order_index ?? index
        }));
        
        try {
          await api.client.post(`/trips/sync`, payload);
        } catch (error) {
          console.error("Sync failed", error);
        }
      },
      
      loadFromBackend: async (userId: number) => {
        try {
          const res = await api.client.get(`/trips/my`);
          if (res.data.success && res.data.data.length > 0) {
            // Take the first trip and its locations
            const trip = res.data.data[0];
            const items: TripItem[] = (trip.tripLocations || []).map((tl: any, idx: number) => ({
              location_id: tl.location.location_id,
              name: tl.location.name,
              thumbnail_url: tl.location.thumbnail_url || (tl.location.images?.[0]),
              order_index: tl.sortOrder || idx,
              visit_date: `Ngày ${tl.day || 1}`
            }));
            set({ tripItems: items });
          }
        } catch (error) {
          console.error("Load failed", error);
        }
      }
    }),
    {
      name: 'travel-trip-storage',
    }
  )
);
