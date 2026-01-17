import { User, type IUserDocument, type IConnectedRepo } from './user.model.js';
import type { CreateUserDTO, UpdateUserDTO } from './user.types.js';
import type { IRepository, QueryOptions, PaginatedResult } from '../../shared/interfaces/index.js';
import { PAGINATION_DEFAULTS } from '../../shared/constants/index.js';

// Interface for User Repository - Dependency Inversion
export interface IUserRepository extends IRepository<IUserDocument, CreateUserDTO, UpdateUserDTO> {
    findByGithubId(githubId: number): Promise<IUserDocument | null>;
    addConnectedRepo(userId: string, repo: Omit<IConnectedRepo, 'connectedAt'>): Promise<IUserDocument | null>;
    removeConnectedRepo(userId: string, repoId: number): Promise<IUserDocument | null>;
    updateRepoWebhookId(userId: string, repoId: number, webhookId: number): Promise<IUserDocument | null>;
}

// Concrete implementation - follows Single Responsibility
export class UserRepository implements IUserRepository {
    async findById(id: string): Promise<IUserDocument | null> {
        return User.findById(id).exec();
    }

    async findOne(filter: Record<string, unknown>): Promise<IUserDocument | null> {
        return User.findOne(filter).exec() as Promise<IUserDocument | null>;
    }

    async findByGithubId(githubId: number): Promise<IUserDocument | null> {
        return User.findOne({ githubId }).exec();
    }

    async findAll(options: QueryOptions = {}): Promise<PaginatedResult<IUserDocument>> {
        const {
            page = PAGINATION_DEFAULTS.PAGE,
            limit = PAGINATION_DEFAULTS.LIMIT,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            filter = {},
        } = options;

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const [data, totalItems] = await Promise.all([
            User.find(filter)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(limit)
                .exec(),
            User.countDocuments(filter).exec(),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                totalPages,
                totalItems,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async create(data: CreateUserDTO): Promise<IUserDocument> {
        const user = new User(data);
        return user.save();
    }

    async update(id: string, data: UpdateUserDTO): Promise<IUserDocument | null> {
        const user = await User.findById(id).exec();
        if (!user) return null;

        // Manually apply updates to ensure middleware (like password/token encryption) is triggered
        if (data.username !== undefined) user.username = data.username;
        if (data.email !== undefined) user.email = data.email;
        if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
        if (data.accessToken !== undefined) user.accessToken = data.accessToken;
        if (data.refreshToken !== undefined) user.refreshToken = data.refreshToken;
        if (data.settings !== undefined) {
            user.settings = { ...user.settings, ...data.settings };
        }

        return user.save();
    }

    async delete(id: string): Promise<boolean> {
        const result = await User.findByIdAndDelete(id).exec();
        return result !== null;
    }

    async addConnectedRepo(
        userId: string,
        repo: Omit<IConnectedRepo, 'connectedAt'>
    ): Promise<IUserDocument | null> {
        return User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    connectedRepos: {
                        ...repo,
                        connectedAt: new Date(),
                    },
                },
            },
            { new: true }
        ).exec();
    }

    async removeConnectedRepo(userId: string, repoId: number): Promise<IUserDocument | null> {
        return User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    connectedRepos: { repoId },
                },
            },
            { new: true }
        ).exec();
    }

    async updateRepoWebhookId(
        userId: string,
        repoId: number,
        webhookId: number
    ): Promise<IUserDocument | null> {
        return User.findOneAndUpdate(
            { _id: userId, 'connectedRepos.repoId': repoId },
            {
                $set: { 'connectedRepos.$.webhookId': webhookId },
            },
            { new: true }
        ).exec();
    }
}

// Export singleton instance
export const userRepository = new UserRepository();
