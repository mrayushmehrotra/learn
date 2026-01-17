import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings } from '@/types';
import { authService } from '@/services';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (token: string, expiresIn: number) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: authService.isAuthenticated(),
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),

            login: (token, expiresIn) => {
                authService.handleCallback(token, expiresIn);
                // After setting token, we should be authenticated
                set({ isAuthenticated: true, isLoading: false });
            },

            logout: async () => {
                try {
                    await authService.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('tokenExpiry');
                }
            },

            checkAuth: async () => {
                // If user is already fetched, skip
                if (get().user) {
                    return;
                }

                // If no token, we are definitely not authenticated
                if (!authService.isAuthenticated()) {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const user = await authService.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    console.error('Auth verification failed:', error);
                    // Don't necessarily clear isAuthenticated yet, maybe it was a network error
                    // But if it was a 401, the interceptor will handle it
                    set({ isLoading: false });
                }
            },

            refreshUser: async () => {
                if (!get().isAuthenticated) return;

                try {
                    const user = await authService.getProfile();
                    set({ user });
                } catch (error) {
                    console.error('Failed to refresh user:', error);
                }
            },

            updateSettings: async (settings) => {
                if (!get().isAuthenticated) return;

                try {
                    const user = await authService.updateSettings(settings);
                    set({ user });
                } catch (error) {
                    console.error('Failed to update settings:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
        }
    )
);

export default useAuthStore;
