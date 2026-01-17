import type { Request, Response } from 'express';
import type { IAuthService } from './auth.service.js';
import type { GitHubCallbackQuery } from './auth.types.js';
import { asyncHandler, createResponse } from '../../shared/interfaces/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { config } from '../../config/index.js';
import { userRepository } from '../users/user.repository.js';

export class AuthController {
    constructor(private readonly authService: IAuthService) { }

    // Redirect to GitHub OAuth
    initiateGitHubAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const state = req.query.state as string | undefined;
        const authUrl = this.authService.getGitHubAuthUrl(state);
        res.redirect(authUrl);
    });

    // Handle GitHub OAuth callback
    handleGitHubCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { code } = req.query as unknown as GitHubCallbackQuery;

        const authResponse = await this.authService.handleGitHubCallback(code);

        // Redirect to frontend with token
        const redirectUrl = new URL(`${config.CLIENT_URL}/auth/callback`);
        redirectUrl.searchParams.set('token', authResponse.tokens.accessToken);
        redirectUrl.searchParams.set('expiresIn', authResponse.tokens.expiresIn.toString());

        res.redirect(redirectUrl.toString());
    });

    // Get current authenticated user
    getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            res.status(HTTP_STATUS.OK).json(createResponse(null));
            return;
        }

        // We need the full user record including connectedRepos
        const user = await userRepository.findById(req.user.id);

        res.status(HTTP_STATUS.OK).json(
            createResponse(user, 'User retrieved successfully', req.requestId)
        );
    });

    // Logout (client should clear token, this is for any server-side cleanup)
    logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        // In a more complex setup, you might invalidate tokens in Redis here
        res.status(HTTP_STATUS.OK).json(
            createResponse(null, 'Logged out successfully')
        );
    });
}
