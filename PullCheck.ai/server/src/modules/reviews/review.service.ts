import type { IReviewDocument } from './review.model.js';
import type { IReviewRepository } from './review.repository.js';
import type {
    CreateReviewDTO,
    ReviewResponse,
    OverrideReviewInput,
    ReviewCommentDTO
} from './review.types.js';
import type { QueryOptions, PaginatedResult } from '../../shared/interfaces/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { REVIEW_STATUS, SEVERITY } from '../../shared/constants/index.js';
import type { IGitHubService } from '../../integrations/github/github.service.js';
import type { IClaudeService, AIReviewResult, AIReviewComment } from '../../integrations/claude/claude.service.js';
import { logger } from '../../config/logger.js';
import { userRepository } from '../users/user.repository.js';

export interface IReviewService {
    getReviewById(id: string): Promise<ReviewResponse>;
    getReviewsByUser(userId: string, options?: QueryOptions & { repoFullName?: string; status?: string }): Promise<PaginatedResult<ReviewResponse>>;
    createReview(data: CreateReviewDTO): Promise<ReviewResponse>;
    processReview(reviewId: string, diff: string, accessToken?: string): Promise<ReviewResponse>;
    overrideReview(reviewId: string, input: OverrideReviewInput): Promise<ReviewResponse>;
    rerunReview(reviewId: string): Promise<ReviewResponse>;
    deleteReview(reviewId: string): Promise<void>;
}

export class ReviewService implements IReviewService {
    constructor(
        private readonly reviewRepository: IReviewRepository,
        private readonly githubService: IGitHubService, // Reserved for future use
        private readonly claudeService: IClaudeService
    ) { }

    // Getter for future use when posting comments to GitHub
    protected get github(): IGitHubService {
        return this.githubService;
    }

    async getReviewById(id: string): Promise<ReviewResponse> {
        const review = await this.reviewRepository.findById(id);
        if (!review) {
            throw new NotFoundError('Review', id);
        }
        return this.toReviewResponse(review);
    }

    async getReviewsByUser(
        userId: string,
        options?: QueryOptions & { repoFullName?: string; status?: string }
    ): Promise<PaginatedResult<ReviewResponse>> {
        const filter: Record<string, unknown> = { userId };

        if (options?.repoFullName) {
            filter.repoFullName = options.repoFullName;
        }
        if (options?.status) {
            filter.status = options.status;
        }

        const result = await this.reviewRepository.findAll({
            ...options,
            filter,
        });

        return {
            data: result.data.map((r) => this.toReviewResponse(r)),
            pagination: result.pagination,
        };
    }

    async createReview(data: CreateReviewDTO): Promise<ReviewResponse> {
        // Check for duplicate delivery (idempotency)
        if (data.deliveryId) {
            const existing = await this.reviewRepository.findByDeliveryId(data.deliveryId);
            if (existing) {
                logger.info(`Duplicate delivery ${data.deliveryId}, returning existing review`);
                return this.toReviewResponse(existing);
            }
        }

        const review = await this.reviewRepository.create(data);
        return this.toReviewResponse(review);
    }

    async processReview(reviewId: string, diff: string, accessToken?: string): Promise<ReviewResponse> {
        const startTime = Date.now();

        // Update status to in_progress
        await this.reviewRepository.update(reviewId, {
            status: REVIEW_STATUS.IN_PROGRESS,
        });

        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundError('Review', reviewId);
        }

        try {
            // Get AI review
            const aiResult = await this.claudeService.reviewCode({
                prTitle: review.prTitle,
                prDescription: review.prBody ?? '',
                baseBranch: review.baseBranch,
                headBranch: review.headBranch,
                diff,
            });

            // Calculate metrics
            const metrics = this.calculateMetrics(aiResult, startTime);

            // Update review with AI results
            const comments: ReviewCommentDTO[] = aiResult.comments.map((c: AIReviewComment, index: number) => ({
                id: `comment-${reviewId}-${index}`,
                filePath: c.filePath,
                lineNumber: c.lineNumber ?? undefined,
                severity: c.severity,
                category: c.category,
                message: c.message,
                codeSnippet: c.codeSnippet ?? undefined,
                isPosted: false,
                isOverridden: false,
            }));

            const updated = await this.reviewRepository.update(reviewId, {
                summary: aiResult.summary,
                overallRating: aiResult.overallRating,
                comments,
                status: REVIEW_STATUS.COMPLETED,
                metrics,
            });

            if (!updated) {
                throw new NotFoundError('Review', reviewId);
            }

            logger.info(`Review ${reviewId} completed in ${metrics.processingTimeMs}ms`);

            // Auto-post to GitHub if token provided
            if (accessToken) {
                await this.postCommentsToGitHub(updated, accessToken);
            }

            return this.toReviewResponse(updated);
        } catch (error) {
            // Mark as failed
            await this.reviewRepository.update(reviewId, {
                status: REVIEW_STATUS.FAILED,
            });

            logger.error(`Review ${reviewId} failed:`, error);
            throw error;
        }
    }

    async overrideReview(reviewId: string, input: OverrideReviewInput): Promise<ReviewResponse> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundError('Review', reviewId);
        }

        // Apply overrides to comments
        const updatedComments = review.comments.map((comment) => {
            const override = input.comments.find((o) => o.commentId === comment.id);
            if (override) {
                return {
                    ...comment,
                    isOverridden: true,
                    overriddenMessage: override.message,
                };
            }
            return comment;
        });

        let updated = await this.reviewRepository.update(reviewId, {
            comments: updatedComments as ReviewCommentDTO[],
            status: REVIEW_STATUS.OVERRIDDEN,
        });

        if (!updated) {
            throw new NotFoundError('Review', reviewId);
        }

        // Post to GitHub if requested
        if (input.postToGitHub) {
            const user = await userRepository.findById(updated.userId.toString());
            if (user) {
                const token = user.decryptToken();
                await this.postCommentsToGitHub(updated, token);
                // Refresh updated object after posting (contains githubReviewId)
                updated = await this.reviewRepository.findById(reviewId);
            }
        }

        return this.toReviewResponse(updated!);
    }

    async rerunReview(reviewId: string): Promise<ReviewResponse> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundError('Review', reviewId);
        }

        const user = await userRepository.findById(review.userId.toString());
        if (!user) {
            throw new Error(`User ${review.userId} not found`);
        }

        const accessToken = user.decryptToken();

        // 1. Fetch fresh diff from GitHub
        const diff = await this.githubService.getPRDiff(
            review.repoFullName,
            review.prNumber,
            accessToken
        );

        // 2. Process review with fresh diff
        return this.processReview(reviewId, diff, accessToken);
    }

    private async postCommentsToGitHub(review: IReviewDocument, token: string): Promise<void> {
        try {
            const inlineComments = review.comments
                .filter(c => c.filePath && c.lineNumber)
                .map(c => ({
                    path: c.filePath,
                    line: c.lineNumber!,
                    body: `**[${c.severity.toUpperCase()}] ${c.category.replace('-', ' ')}**\n\n${c.isOverridden ? c.overriddenMessage : c.message}`,
                }));

            const summaryBody = `### AI Code Review Summary\n\n${review.summary}\n\n**Overall Rating:** ${review.overallRating.replace('_', ' ')}\n\n*Review generated by [PullCheck](https://github.com/mrayush/PullCheck.ai)*`;

            let githubResponse;
            if (inlineComments.length > 0) {
                githubResponse = await this.githubService.postInlineComments(
                    review.repoFullName,
                    review.prNumber,
                    review.commitSha,
                    inlineComments,
                    summaryBody,
                    token
                );
            } else {
                githubResponse = await this.githubService.postReviewComment(
                    review.repoFullName,
                    review.prNumber,
                    summaryBody,
                    token
                );
            }

            // Record the GitHub review ID
            await this.reviewRepository.update(review.id, {
                githubReviewId: githubResponse.id,
            });

            logger.info(`Posted review to GitHub for PR #${review.prNumber} (ID: ${githubResponse.id})`);
        } catch (error) {
            logger.error(`Failed to post comments to GitHub for review ${review.id}:`, error);
        }
    }

    async deleteReview(reviewId: string): Promise<void> {
        const deleted = await this.reviewRepository.delete(reviewId);
        if (!deleted) {
            throw new NotFoundError('Review', reviewId);
        }
    }

    private calculateMetrics(aiResult: AIReviewResult, startTime: number) {
        const comments = aiResult.comments;
        const uniqueFiles = new Set(comments.map((c: AIReviewComment) => c.filePath));

        return {
            criticalCount: comments.filter((c: AIReviewComment) => c.severity === SEVERITY.CRITICAL).length,
            warningCount: comments.filter((c: AIReviewComment) => c.severity === SEVERITY.WARNING).length,
            infoCount: comments.filter((c: AIReviewComment) => c.severity === SEVERITY.INFO).length,
            suggestionCount: comments.filter((c: AIReviewComment) => c.severity === SEVERITY.SUGGESTION).length,
            totalComments: comments.length,
            filesReviewed: uniqueFiles.size,
            processingTimeMs: Date.now() - startTime,
        };
    }

    private toReviewResponse(review: IReviewDocument): ReviewResponse {
        return {
            id: review.id,
            userId: review.userId.toString(),
            repoFullName: review.repoFullName,
            prNumber: review.prNumber,
            prTitle: review.prTitle,
            prUrl: review.prUrl,
            prBody: review.prBody,
            commitSha: review.commitSha,
            baseBranch: review.baseBranch,
            headBranch: review.headBranch,
            summary: review.summary,
            overallRating: review.overallRating,
            comments: review.comments as unknown as ReviewCommentDTO[],
            status: review.status,
            metrics: review.metrics,
            githubReviewId: review.githubReviewId,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        };
    }
}
