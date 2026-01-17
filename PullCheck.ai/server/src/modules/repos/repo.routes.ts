import { Router } from 'express';
import { RepoController } from './repo.controller.js';
import { githubService } from '../../integrations/github/github.service.js';
import { UserService } from '../users/user.service.js';
import { userRepository } from '../users/user.repository.js';
import { authenticate } from '../auth/auth.middleware.js';

const userService = new UserService(userRepository, githubService);
const repoController = new RepoController(githubService, userService);

const router = Router();

router.use(authenticate);

router.get('/github', repoController.listGitHubRepos);

export { router as repoRoutes };
