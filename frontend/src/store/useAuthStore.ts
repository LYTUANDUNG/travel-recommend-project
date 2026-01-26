import { create } from 'zustand';

export interface User {
    id: number;
    name: string;
    avatar: string;
    interests: string[]; // e.g., ['Nature', 'Food']
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loginAsGuest: () => void;
    loginAsUser: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,

    loginAsGuest: () => set({
        user: null,
        isAuthenticated: false
    }),

    loginAsUser: () => set({
        user: {
            id: 1,
            name: 'Nguyen Van A',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            interests: ['Thiên nhiên', 'Di tích'] // Mock interests
        },
        isAuthenticated: true
    }),

    logout: () => set({
        user: null,
        isAuthenticated: false
    }),
}));
