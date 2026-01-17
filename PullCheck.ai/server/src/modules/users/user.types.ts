import { z } from 'zod';

// DTOs for User operations
export interface CreateUserDTO {
    githubId: number;
    username: string;
    email: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
}

export interface UpdateUserDTO {
    username?: string;
    email?: string;
    avatarUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    settings?: Partial<UserSettings>;
}

export interface UserSettings {
    autoReview: boolean;
    reviewOnDraft: boolean;
    notifyOnComplete: boolean;
}

export interface ConnectedRepo {
    repoId: number;
    fullName: string;
    webhookId?: number;
    isActive: boolean;
    connectedAt: Date;
}

export interface UserResponse {
    id: string;
    githubId: number;
    username: string;
    email: string;
    avatarUrl: string;
    connectedRepos: ConnectedRepo[];
    settings: UserSettings;
    createdAt: Date;
    updatedAt: Date;
}

// Zod schemas for validation
export const updateUserSettingsSchema = z.object({
    autoReview: z.boolean().optional(),
    reviewOnDraft: z.boolean().optional(),
    notifyOnComplete: z.boolean().optional(),
});

export const connectRepoSchema = z.object({
    repoId: z.number().positive(),
    fullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'Invalid repository format (owner/repo)'),
});
