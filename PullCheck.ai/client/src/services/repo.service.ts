import api from './api';
import type { User, Repository } from '@/types';
import type { ApiResponse } from '@/types/api';

export interface ConnectRepoInput {
    repoId: number;
    fullName: string;
}

export const repoService = {
    // List user's GitHub repositories
    async listGitHubRepos(): Promise<Repository[]> {
        const response = await api.get<ApiResponse<Repository[]>>('/repos/github');
        return response.data.data;
    },

    // Connect a repository
    async connectRepo(input: ConnectRepoInput): Promise<User> {
        const response = await api.post<ApiResponse<User>>('/users/me/repos', input);
        return response.data.data;
    },

    // Disconnect a repository
    async disconnectRepo(repoId: number): Promise<User> {
        const response = await api.delete<ApiResponse<User>>(`/users/me/repos/${repoId}`);
        return response.data.data;
    },
};

export default repoService;
