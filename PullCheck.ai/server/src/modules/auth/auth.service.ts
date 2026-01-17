import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import type { IUserService } from '../users/user.service.js';
import type {
    GitHubUser,
    GitHubTokenResponse,
    AuthTokens,
    AuthResponse
} from './auth.types.js';
import { ExternalServiceError, UnauthorizedError } from '../../shared/errors/index.js';

export interface IAuthService {
    getGitHubAuthUrl(state?: string): string;
    handleGitHubCallback(code: string): Promise<AuthResponse>;
    generateTokens(userId: string, githubId: number, username: string): AuthTokens;
    verifyToken(token: string): { userId: string; githubId: number; username: string } | null;
}

export class AuthService implements IAuthService {
    private readonly githubAuthUrl = 'https://github.com/login/oauth/authorize';
    private readonly githubTokenUrl = 'https://github.com/login/oauth/access_token';
    private readonly githubApiUrl = 'https://api.github.com';

    constructor(private readonly userService: IUserService) { }

    getGitHubAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: config.GITHUB_CLIENT_ID,
            redirect_uri: `${config.SERVER_URL}/api/${config.API_VERSION}/auth/github/callback`,
            scope: 'repo read:user user:email',
            state: state ?? crypto.randomUUID(),
        });

        return `${this.githubAuthUrl}?${params.toString()}`;
    }

    async handleGitHubCallback(code: string): Promise<AuthResponse> {
        // Exchange code for access token
        const tokenResponse = await this.exchangeCodeForToken(code);

        // Get GitHub user info
        const githubUser = await this.getGitHubUser(tokenResponse.access_token);

        // Get user's primary email if not provided
        let email = githubUser.email;
        if (!email) {
            email = await this.getGitHubUserEmail(tokenResponse.access_token);
        }

        // Create or update user in database
        const user = await this.userService.createOrUpdateUser({
            githubId: githubUser.id,
            username: githubUser.login,
            email: email,
            avatarUrl: githubUser.avatar_url,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
        });

        // Generate JWT tokens
        const tokens = this.generateTokens(user.id, user.githubId, user.username);

        logger.info(`User authenticated: ${user.username} (${user.githubId})`);

        return {
            user: {
                id: user.id,
                githubId: user.githubId,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
            tokens,
        };
    }

    generateTokens(userId: string, githubId: number, username: string): AuthTokens {
        const expiresInSeconds = this.parseExpiresIn(config.JWT_EXPIRES_IN);

        const accessToken = jwt.sign(
            { userId, githubId, username },
            config.JWT_SECRET,
            { expiresIn: expiresInSeconds }
        );

        return { accessToken, expiresIn: expiresInSeconds };
    }

    verifyToken(token: string): { userId: string; githubId: number; username: string } | null {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as {
                userId: string;
                githubId: number;
                username: string;
            };
            return decoded;
        } catch {
            return null;
        }
    }

    private async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
        const response = await fetch(this.githubTokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: config.GITHUB_CLIENT_ID,
                client_secret: config.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        if (!response.ok) {
            throw new ExternalServiceError('GitHub', 'Failed to exchange code for token');
        }

        const data = await response.json() as GitHubTokenResponse & { error?: string };

        if (data.error) {
            throw new UnauthorizedError(`GitHub OAuth error: ${data.error}`);
        }

        return data;
    }

    private async getGitHubUser(accessToken: string): Promise<GitHubUser> {
        const response = await fetch(`${this.githubApiUrl}/user`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new ExternalServiceError('GitHub', 'Failed to fetch user info');
        }

        return response.json() as Promise<GitHubUser>;
    }

    private async getGitHubUserEmail(accessToken: string): Promise<string> {
        const response = await fetch(`${this.githubApiUrl}/user/emails`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new ExternalServiceError('GitHub', 'Failed to fetch user emails');
        }

        const emails = await response.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        const primaryEmail = emails.find((e) => e.primary && e.verified);

        return primaryEmail?.email ?? emails[0]?.email ?? '';
    }

    private parseExpiresIn(expiresIn: string): number {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1), 10);

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 60 * 60 * 24;
            default: return 3600; // Default 1 hour
        }
    }
}
