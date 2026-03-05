import { create } from 'zustand';
import { User } from '../types';

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
            user_id: 1,
            username: 'nguyenvana',
            email: 'user@example.com',
            full_name: 'Nguyen Van A',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            role: 'USER',
            created_at: new Date().toISOString(),
            interests: ['Thiên nhiên', 'Di tích', 'Ẩm thực'] // Mock interests
        },
        isAuthenticated: true
    }),

    logout: () => set({
        user: null,
        isAuthenticated: false
    }),
}));
