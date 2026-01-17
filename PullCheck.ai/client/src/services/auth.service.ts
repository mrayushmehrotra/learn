import api from './api';
import type { User, UserSettings } from '@/types';
import type { ApiResponse } from '@/types/api';

export interface AuthCallbackResponse {
    user: {
        id: string;
        githubId: number;
        username: string;
        email: string;
        avatarUrl: string;
    };
    tokens: {
        accessToken: string;
        expiresIn: number;
    };
}

export const authService = {
    // Get GitHub OAuth URL
    getGitHubAuthUrl(): string {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        return `${baseUrl}/api/v1/auth/github`;
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await api.get<ApiResponse<User>>('/auth/me');
        return response.data.data;
    },

    // Logout
    async logout(): Promise<void> {
        await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiry');
    },

    // Handle OAuth callback (called from callback page)
    handleCallback(token: string, expiresIn: number): void {
        localStorage.setItem('accessToken', token);
        const expiry = Date.now() + expiresIn * 1000;
        localStorage.setItem('tokenExpiry', expiry.toString());
    },

    // Check if authenticated
    isAuthenticated(): boolean {
        const token = localStorage.getItem('accessToken');
        const expiry = localStorage.getItem('tokenExpiry');

        if (!token || !expiry) return false;

        return Date.now() < parseInt(expiry, 10);
    },

    // Get user profile
    async getProfile(): Promise<User> {
        const response = await api.get<ApiResponse<User>>('/users/me');
        return response.data.data;
    },

    // Update user settings
    async updateSettings(settings: Partial<UserSettings>): Promise<User> {
        const response = await api.patch<ApiResponse<User>>('/users/me/settings', settings);
        return response.data.data;
    },
};

export default authService;
