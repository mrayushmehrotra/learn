import crypto from 'crypto';
import type { WebhookPayload, ProcessedWebhook } from './webhook.types.js';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import { GITHUB_EVENTS } from '../../shared/constants/index.js';
import type { IReviewService } from '../reviews/review.service.js';
import type { IGitHubService } from '../../integrations/github/github.service.js';
import { userRepository } from '../users/user.repository.js';

export interface IWebhookService {
    verifySignature(payload: string, signature: string): boolean;
    processWebhook(event: string, deliveryId: string, payload: WebhookPayload): Promise<ProcessedWebhook>;
}

export class WebhookService implements IWebhookService {
    constructor(
        private readonly reviewService: IReviewService,
        private readonly githubService: IGitHubService
    ) { }

    verifySignature(payload: string, signature: string): boolean {
        const expectedSignature = `sha256=${crypto
            .createHmac('sha256', config.GITHUB_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex')}`;

        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    }

    async processWebhook(
        event: string,
        deliveryId: string,
        payload: WebhookPayload
    ): Promise<ProcessedWebhook> {
        const fullEvent = `${event}.${payload.action}`;

        logger.info(`Processing webhook: ${fullEvent}`, {
            deliveryId,
            repo: payload.repository?.full_name,
            pr: payload.pull_request?.number,
        });

        // Check if this is a PR event we care about
        if (!this.isPREvent(fullEvent)) {
            logger.info(`Skipping non-PR event: ${fullEvent}`);
            return {
                event,
                action: payload.action,
                deliveryId,
                repoFullName: payload.repository?.full_name ?? 'unknown',
                prNumber: payload.pull_request?.number ?? 0,
                processed: false,
            };
        }

        // Skip draft PRs (unless configured otherwise)
        if (payload.pull_request?.draft) {
            logger.info(`Skipping draft PR: ${payload.pull_request.number}`);
            return {
                event,
                action: payload.action,
                deliveryId,
                repoFullName: payload.repository?.full_name ?? 'unknown',
                prNumber: payload.pull_request.number,
                processed: false,
            };
        }

        const pr = payload.pull_request!;
        const repo = payload.repository!;

        // Find user with this repo connected
        const user = await this.findUserForRepo(repo.full_name);
        if (!user) {
            logger.warn(`No user found for repo: ${repo.full_name}`);
            return {
                event,
                action: payload.action,
                deliveryId,
                repoFullName: repo.full_name,
                prNumber: pr.number,
                processed: false,
            };
        }

        try {
            // Create review record
            const review = await this.reviewService.createReview({
                userId: user.id,
                repoFullName: repo.full_name,
                prNumber: pr.number,
                prTitle: pr.title,
                prUrl: pr.html_url,
                prBody: pr.body ?? undefined,
                commitSha: pr.head.sha,
                baseBranch: pr.base.ref,
                headBranch: pr.head.ref,
                deliveryId,
            });

            // Fetch PR diff and process (async - don't await)
            this.processReviewAsync(review.id, repo.full_name, pr.number, user.id);

            return {
                event,
                action: payload.action,
                deliveryId,
                repoFullName: repo.full_name,
                prNumber: pr.number,
                processed: true,
                reviewId: review.id,
            };
        } catch (error) {
            logger.error(`Failed to process webhook for PR #${pr.number}:`, error);
            throw error;
        }
    }

    private isPREvent(fullEvent: string): boolean {
        const prEvents = [
            GITHUB_EVENTS.PULL_REQUEST_OPENED,
            GITHUB_EVENTS.PULL_REQUEST_SYNCHRONIZE,
            GITHUB_EVENTS.PULL_REQUEST_REOPENED,
        ] as string[];
        return prEvents.includes(fullEvent);
    }

    private async findUserForRepo(repoFullName: string) {
        // Find user who has this repo connected
        const users = await userRepository.findAll({
            filter: {
                'connectedRepos.fullName': repoFullName,
                'connectedRepos.isActive': true,
            },
        });

        return users.data[0] ?? null;
    }

    private async processReviewAsync(
        reviewId: string,
        repoFullName: string,
        prNumber: number,
        userId: string
    ): Promise<void> {
        try {
            // Get user's GitHub token
            const user = await userRepository.findById(userId);
            if (!user) {
                throw new Error(`User ${userId} not found`);
            }

            const accessToken = user.decryptToken();

            // Fetch PR diff
            const diff = await this.githubService.getPRDiff(repoFullName, prNumber, accessToken);

            // Process the review with AI and post to GitHub
            await this.reviewService.processReview(reviewId, diff, accessToken);

            logger.info(`Review ${reviewId} processed and posted successfully`);
        } catch (error) {
            logger.error(`Async review processing failed for ${reviewId}:`, error);
        }
    }
}
