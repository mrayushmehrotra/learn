import { Octokit } from 'octokit';
import type {
    GitHubRepository,
    GitHubPullRequest,
    GitHubReviewComment,
    GitHubReview,
    CreateWebhookParams,
} from './github.types.js';
import { ExternalServiceError } from '../../shared/errors/index.js';
import { logger } from '../../config/logger.js';


// Interface for GitHub service - allows for easy mocking
export interface IGitHubService {
    getUserRepos(accessToken: string): Promise<GitHubRepository[]>;
    getPullRequest(repoFullName: string, prNumber: number, accessToken: string): Promise<GitHubPullRequest>;
    getPRDiff(repoFullName: string, prNumber: number, accessToken: string): Promise<string>;
    postReviewComment(
        repoFullName: string,
        prNumber: number,
        body: string,
        accessToken: string
    ): Promise<GitHubReview>;
    postInlineComments(
        repoFullName: string,
        prNumber: number,
        commitSha: string,
        comments: GitHubReviewComment[],
        body: string,
        accessToken: string
    ): Promise<GitHubReview>;
    createWebhook(params: CreateWebhookParams, accessToken: string): Promise<number>;
    deleteWebhook(repoFullName: string, webhookId: number, accessToken: string): Promise<void>;
}

export class GitHubService implements IGitHubService {
    private createOctokit(accessToken: string): Octokit {
        return new Octokit({ auth: accessToken });
    }

    private parseRepoFullName(repoFullName: string): { owner: string; repo: string } {
        const [owner, repo] = repoFullName.split('/');
        if (!owner || !repo) {
            throw new Error(`Invalid repository format: ${repoFullName}`);
        }
        return { owner, repo };
    }

    async getUserRepos(accessToken: string): Promise<GitHubRepository[]> {
        try {
            const octokit = this.createOctokit(accessToken);

            const response = await octokit.rest.repos.listForAuthenticatedUser({
                visibility: 'all',
                sort: 'updated',
                per_page: 100,
            });

            return response.data as GitHubRepository[];
        } catch (error) {
            logger.error('Failed to fetch user repositories:', error);
            throw new ExternalServiceError('GitHub', 'Failed to fetch repositories');
        }
    }

    async getPullRequest(
        repoFullName: string,
        prNumber: number,
        accessToken: string
    ): Promise<GitHubPullRequest> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(repoFullName);

            const response = await octokit.rest.pulls.get({
                owner,
                repo,
                pull_number: prNumber,
            });

            return response.data as unknown as GitHubPullRequest;
        } catch (error) {
            logger.error(`Failed to fetch PR #${prNumber}:`, error);
            throw new ExternalServiceError('GitHub', `Failed to fetch PR #${prNumber}`);
        }
    }

    async getPRDiff(
        repoFullName: string,
        prNumber: number,
        accessToken: string
    ): Promise<string> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(repoFullName);

            const response = await octokit.rest.pulls.get({
                owner,
                repo,
                pull_number: prNumber,
                mediaType: {
                    format: 'diff',
                },
            });

            // When requesting diff format, data is a string
            return response.data as unknown as string;
        } catch (error) {
            logger.error(`Failed to fetch diff for PR #${prNumber}:`, error);
            throw new ExternalServiceError('GitHub', `Failed to fetch PR diff`);
        }
    }

    async postReviewComment(
        repoFullName: string,
        prNumber: number,
        body: string,
        accessToken: string
    ): Promise<GitHubReview> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(repoFullName);

            const response = await octokit.rest.pulls.createReview({
                owner,
                repo,
                pull_number: prNumber,
                body,
                event: 'COMMENT',
            });

            return response.data as unknown as GitHubReview;
        } catch (error) {
            logger.error(`Failed to post review comment on PR #${prNumber}:`, error);
            throw new ExternalServiceError('GitHub', 'Failed to post review comment');
        }
    }

    async postInlineComments(
        repoFullName: string,
        prNumber: number,
        commitSha: string,
        comments: GitHubReviewComment[],
        body: string,
        accessToken: string
    ): Promise<GitHubReview> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(repoFullName);

            const response = await octokit.rest.pulls.createReview({
                owner,
                repo,
                pull_number: prNumber,
                commit_id: commitSha,
                body,
                event: 'COMMENT',
                comments: comments.map((c) => ({
                    path: c.path,
                    line: c.line,
                    body: c.body,
                })),
            });

            return response.data as unknown as GitHubReview;
        } catch (error) {
            logger.error(`Failed to post inline comments on PR #${prNumber}:`, error);
            throw new ExternalServiceError('GitHub', 'Failed to post inline comments');
        }
    }

    async createWebhook(params: CreateWebhookParams, accessToken: string): Promise<number> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(params.repoFullName);

            const response = await octokit.rest.repos.createWebhook({
                owner,
                repo,
                name: 'web',
                active: true,
                events: params.events,
                config: {
                    url: params.url,
                    content_type: 'json',
                    secret: params.secret,
                    insecure_ssl: '0',
                },
            });

            logger.info(`Created webhook for ${params.repoFullName}: ${response.data.id}`);
            return response.data.id;
        } catch (error) {
            logger.error(`Failed to create webhook for ${params.repoFullName}:`, error);
            throw new ExternalServiceError('GitHub', 'Failed to create webhook');
        }
    }

    async deleteWebhook(
        repoFullName: string,
        webhookId: number,
        accessToken: string
    ): Promise<void> {
        try {
            const octokit = this.createOctokit(accessToken);
            const { owner, repo } = this.parseRepoFullName(repoFullName);

            await octokit.rest.repos.deleteWebhook({
                owner,
                repo,
                hook_id: webhookId,
            });

            logger.info(`Deleted webhook ${webhookId} for ${repoFullName}`);
        } catch (error) {
            logger.error(`Failed to delete webhook ${webhookId}:`, error);
            throw new ExternalServiceError('GitHub', 'Failed to delete webhook');
        }
    }
}

// Export singleton instance
export const githubService = new GitHubService();
