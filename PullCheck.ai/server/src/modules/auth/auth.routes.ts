import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserService } from '../users/user.service.js';
import { userRepository } from '../users/user.repository.js';
import { authenticate } from './auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.js';
import { githubCallbackSchema } from './auth.types.js';

import { githubService } from '../../integrations/github/github.service.js';

// Dependency Injection
const userService = new UserService(userRepository, githubService);
const authService = new AuthService(userService);
const authController = new AuthController(authService);

const router = Router();

// Public routes
router.get('/github', authController.initiateGitHubAuth);
router.get('/github/callback', validate({ query: githubCallbackSchema }), authController.handleGitHubCallback);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

export { router as authRoutes };
