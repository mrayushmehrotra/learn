import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 - redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
            window.location.href = '/login';
        }

        // Extract error message
        const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';

        // Create enhanced error
        const enhancedError = new Error(errorMessage) as Error & {
            code?: string;
            details?: Record<string, string[]>;
            status?: number;
        };
        enhancedError.code = error.response?.data?.error?.code;
        enhancedError.details = error.response?.data?.error?.details;
        enhancedError.status = error.response?.status;

        return Promise.reject(enhancedError);
    }
);

export default api;
