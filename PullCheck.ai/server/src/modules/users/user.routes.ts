import { Router } from 'express';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { userRepository } from './user.repository.js';
import { validate, paginationSchema } from '../../shared/middlewares/validate.js';
import { updateUserSettingsSchema, connectRepoSchema } from './user.types.js';
import { authenticate } from '../auth/auth.middleware.js';
import { githubService } from '../../integrations/github/github.service.js';

// Dependency Injection - wire up dependencies
const userService = new UserService(userRepository, githubService);
const userController = new UserController(userService);

const router = Router();

// All routes require authentication
router.use(authenticate);

// Current user routes
router.get('/me', userController.getMe);
router.patch('/me/settings', validate({ body: updateUserSettingsSchema }), userController.updateSettings);

// Repository management
router.post('/me/repos', validate({ body: connectRepoSchema }), userController.connectRepo);
router.delete('/me/repos/:repoId', userController.disconnectRepo);

// Admin routes (list all users)
router.get('/', validate({ query: paginationSchema }), userController.listUsers);
router.get('/:id', userController.getUser);

export { router as userRoutes };
