import type { IUserDocument, IConnectedRepo } from './user.model.js';
import type { IUserRepository } from './user.repository.js';
import type { CreateUserDTO, UserResponse, UserSettings } from './user.types.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import type { QueryOptions, PaginatedResult } from '../../shared/interfaces/index.js';
import type { IGitHubService } from '../../integrations/github/github.service.js';
import { config } from '../../config/index.js';

// Service interface - Dependency Inversion
export interface IUserService {
    getUserById(id: string): Promise<UserResponse>;
    getUserByGithubId(githubId: number): Promise<UserResponse | null>;
    createOrUpdateUser(data: CreateUserDTO): Promise<UserResponse>;
    updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserResponse>;
    connectRepository(userId: string, repo: Omit<IConnectedRepo, 'connectedAt'>): Promise<UserResponse>;
    disconnectRepository(userId: string, repoId: number): Promise<UserResponse>;
    listUsers(options?: QueryOptions): Promise<PaginatedResult<UserResponse>>;
    getDecryptedToken(userId: string): Promise<string>;
}

// Service implementation - Business logic only (Single Responsibility)
export class UserService implements IUserService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly githubService: IGitHubService
    ) { }

    async getUserById(id: string): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User', id);
        }
        return this.toUserResponse(user);
    }

    async getUserByGithubId(githubId: number): Promise<UserResponse | null> {
        const user = await this.userRepository.findByGithubId(githubId);
        return user ? this.toUserResponse(user) : null;
    }

    async createOrUpdateUser(data: CreateUserDTO): Promise<UserResponse> {
        const existingUser = await this.userRepository.findByGithubId(data.githubId);

        if (existingUser) {
            const updated = await this.userRepository.update(existingUser.id, {
                username: data.username,
                email: data.email,
                avatarUrl: data.avatarUrl,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            });
            if (!updated) {
                throw new NotFoundError('User', existingUser.id);
            }
            return this.toUserResponse(updated);
        }

        const newUser = await this.userRepository.create(data);
        return this.toUserResponse(newUser);
    }

    async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }

        const updatedUser = await this.userRepository.update(userId, {
            settings: { ...user.settings, ...settings },
        });

        if (!updatedUser) {
            throw new NotFoundError('User', userId);
        }

        return this.toUserResponse(updatedUser);
    }

    async connectRepository(
        userId: string,
        repo: Omit<IConnectedRepo, 'connectedAt'>
    ): Promise<UserResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }

        // Check if repo is already connected
        const existingRepo = user.connectedRepos.find((r) => r.repoId === repo.repoId);
        if (existingRepo) {
            throw new ConflictError(`Repository ${repo.fullName} is already connected`);
        }

        const updatedUser = await this.userRepository.addConnectedRepo(userId, repo);
        if (!updatedUser) {
            throw new NotFoundError('User', userId);
        }

        // Create GitHub webhook
        try {
            const accessToken = user.decryptToken();
            const webhookId = await this.githubService.createWebhook({
                repoFullName: repo.fullName,
                events: ['pull_request'],
                secret: config.GITHUB_WEBHOOK_SECRET,
                url: `${config.SERVER_URL}/api/v1/webhooks`,
            }, accessToken);

            // Update user with webhook ID
            await this.userRepository.updateRepoWebhookId(userId, repo.repoId, webhookId);
        } catch (error) {
            // Log error but don't fail the whole connection
            // Ideally we'd have a way to retry or mark as "webhook pending"
            console.error(`Failed to create webhook for ${repo.fullName}:`, error);
        }

        // Fetch user again to get updated connectedRepos with webhookId
        const finalUser = await this.userRepository.findById(userId);
        return this.toUserResponse(finalUser!);
    }

    async disconnectRepository(userId: string, repoId: number): Promise<UserResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }

        const repo = user.connectedRepos.find((r) => r.repoId === repoId);
        if (!repo) {
            throw new NotFoundError('Repository', repoId.toString());
        }

        // Delete GitHub webhook if it exists
        if (repo.webhookId) {
            try {
                const accessToken = user.decryptToken();
                await this.githubService.deleteWebhook(repo.fullName, repo.webhookId, accessToken);
            } catch (error) {
                console.error(`Failed to delete webhook for ${repo.fullName}:`, error);
            }
        }

        const updatedUser = await this.userRepository.removeConnectedRepo(userId, repoId);
        if (!updatedUser) {
            throw new NotFoundError('User', userId);
        }

        return this.toUserResponse(updatedUser);
    }

    async listUsers(options?: QueryOptions): Promise<PaginatedResult<UserResponse>> {
        const result = await this.userRepository.findAll(options);
        return {
            data: result.data.map((user) => this.toUserResponse(user)),
            pagination: result.pagination,
        };
    }

    async getDecryptedToken(userId: string): Promise<string> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }
        return user.decryptToken();
    }

    // Transform to response DTO - excludes sensitive data
    private toUserResponse(user: IUserDocument): UserResponse {
        return {
            id: user.id,
            githubId: user.githubId,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            connectedRepos: user.connectedRepos,
            settings: user.settings,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
