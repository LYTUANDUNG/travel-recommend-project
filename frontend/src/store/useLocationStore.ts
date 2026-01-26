import { create } from 'zustand';
import type { Location } from '../types';

export interface LocationStore {
  locations: Location[];
  selectedLocation: Location | null;
  loading: boolean;
  setLocations: (locations: Location[]) => void;
  setSelected: (location: Location | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  locations: [],
  selectedLocation: null,
  loading: false,
  setLocations: (locations) => set({ locations }),
  setSelected: (selectedLocation) => set({ selectedLocation }),
  setLoading: (loading) => set({ loading }),
}));