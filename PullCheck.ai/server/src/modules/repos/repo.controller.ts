import type { Request, Response } from 'express';
import type { IGitHubService } from '../../integrations/github/github.service.js';
import type { IUserService } from '../users/user.service.js';
import { asyncHandler, createResponse } from '../../shared/interfaces/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export class RepoController {
    constructor(
        private readonly githubService: IGitHubService,
        private readonly userService: IUserService
    ) { }

    listGitHubRepos = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const accessToken = await this.userService.getDecryptedToken(userId);
        const githubRepos = await this.githubService.getUserRepos(accessToken);

        // Map to our Repository type (camelCase)
        const repos = githubRepos.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            htmlUrl: repo.html_url,
            description: repo.description,
            defaultBranch: repo.default_branch,
        }));

        res.status(HTTP_STATUS.OK).json(createResponse(repos, 'Repositories retrieved successfully', req.requestId));
    });
}
