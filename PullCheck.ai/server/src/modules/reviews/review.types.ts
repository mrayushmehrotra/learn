import { z } from 'zod';
import type { ReviewStatus, Severity } from '../../shared/constants/index.js';

// DTOs
export interface CreateReviewDTO {
    userId: string;
    repoFullName: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    prBody?: string;
    commitSha: string;
    baseBranch: string;
    headBranch: string;
    deliveryId?: string;
}

export interface UpdateReviewDTO {
    summary?: string;
    overallRating?: 'approve' | 'request_changes' | 'comment';
    comments?: ReviewCommentDTO[];
    status?: ReviewStatus;
    metrics?: ReviewMetricsDTO;
    githubReviewId?: number;
}

export interface ReviewCommentDTO {
    id: string;
    filePath: string;
    lineNumber?: number;
    severity: Severity;
    category: string;
    message: string;
    codeSnippet?: string;
    isPosted?: boolean;
    isOverridden?: boolean;
    overriddenMessage?: string;
}

export interface ReviewMetricsDTO {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    suggestionCount: number;
    totalComments: number;
    filesReviewed: number;
    processingTimeMs: number;
}

export interface ReviewResponse {
    id: string;
    userId: string;
    repoFullName: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    prBody?: string;
    commitSha: string;
    baseBranch: string;
    headBranch: string;
    summary: string;
    overallRating: 'approve' | 'request_changes' | 'comment';
    comments: ReviewCommentDTO[];
    status: ReviewStatus;
    metrics: ReviewMetricsDTO;
    githubReviewId?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Validation schemas
export const overrideCommentSchema = z.object({
    commentId: z.string().min(1),
    message: z.string().min(1).max(5000),
});

export const overrideReviewSchema = z.object({
    comments: z.array(overrideCommentSchema).min(1),
    postToGitHub: z.boolean().default(true),
});

export const reviewQuerySchema = z.object({
    repoFullName: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'overridden']).optional(),
    page: z.string().optional().transform((val) => parseInt(val ?? '1', 10)),
    limit: z.string().optional().transform((val) => Math.min(parseInt(val ?? '10', 10), 100)),
});

export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
export type OverrideReviewInput = z.infer<typeof overrideReviewSchema>;
