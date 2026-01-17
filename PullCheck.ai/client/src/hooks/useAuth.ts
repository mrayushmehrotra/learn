import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';

export function useAuth() {
    const {
        user,
        isAuthenticated,
        isLoading,
        error,
        checkAuth,
        logout,
        refreshUser,
        updateSettings,
    } = useAuthStore();

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        logout,
        refreshUser,
        updateSettings,
        getGitHubAuthUrl: authService.getGitHubAuthUrl,
    };
}

export default useAuth;
