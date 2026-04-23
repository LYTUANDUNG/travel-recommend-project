import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

import { useTripStore } from './useTripStore';
import { useLocationStore } from './useLocationStore';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loginAsUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            loginAsUser: (userData: User) => {
                set({
                    user: userData,
                    isAuthenticated: true
                });
                // Restore trip planner from backend
                useTripStore.getState().loadFromBackend(userData.user_id);
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false
                });
                // Clear trip planner and locations on logout for isolation
                useTripStore.getState().clearTrip();
                useLocationStore.getState().setSelected(null);
            },
        }),
        {
            name: 'travel-auth-storage',
        }
    )
);
