import { z } from 'zod';

export interface GitHubUser {
    id: number;
    login: string;
    email: string;
    avatar_url: string;
    name?: string;
}

export interface GitHubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
}

export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}

export interface AuthResponse {
    user: {
        id: string;
        githubId: number;
        username: string;
        email: string;
        avatarUrl: string;
    };
    tokens: AuthTokens;
}

// Validation schemas
export const githubCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
});

export type GitHubCallbackQuery = z.infer<typeof githubCallbackSchema>;
