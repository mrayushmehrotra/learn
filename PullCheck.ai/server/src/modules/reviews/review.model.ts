import { Schema, model, Document, Types } from 'mongoose';
import { REVIEW_STATUS, SEVERITY, type ReviewStatus, type Severity } from '../../shared/constants/index.js';

export interface IReviewComment {
    id: string;
    filePath: string;
    lineNumber?: number;
    severity: Severity;
    category: string;
    message: string;
    codeSnippet?: string;
    isPosted: boolean;
    isOverridden: boolean;
    overriddenMessage?: string;
}

export interface IReviewMetrics {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    suggestionCount: number;
    totalComments: number;
    filesReviewed: number;
    processingTimeMs: number;
}

export interface IReview {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
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
    comments: IReviewComment[];
    status: ReviewStatus;
    metrics: IReviewMetrics;
    githubReviewId?: number;
    deliveryId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReviewDocument extends Omit<IReview, '_id'>, Document { }

const reviewCommentSchema = new Schema<IReviewComment>(
    {
        id: { type: String, required: true },
        filePath: { type: String, required: true },
        lineNumber: { type: Number },
        severity: {
            type: String,
            enum: Object.values(SEVERITY),
            required: true,
        },
        category: { type: String, required: true },
        message: { type: String, required: true },
        codeSnippet: { type: String },
        isPosted: { type: Boolean, default: false },
        isOverridden: { type: Boolean, default: false },
        overriddenMessage: { type: String },
    },
    { _id: false }
);

const reviewMetricsSchema = new Schema<IReviewMetrics>(
    {
        criticalCount: { type: Number, default: 0 },
        warningCount: { type: Number, default: 0 },
        infoCount: { type: Number, default: 0 },
        suggestionCount: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        filesReviewed: { type: Number, default: 0 },
        processingTimeMs: { type: Number, default: 0 },
    },
    { _id: false }
);

const reviewSchema = new Schema<IReviewDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        repoFullName: {
            type: String,
            required: true,
            index: true,
        },
        prNumber: {
            type: Number,
            required: true,
        },
        prTitle: {
            type: String,
            required: true,
        },
        prUrl: {
            type: String,
            required: true,
        },
        prBody: {
            type: String,
        },
        commitSha: {
            type: String,
            required: true,
        },
        baseBranch: {
            type: String,
            required: true,
        },
        headBranch: {
            type: String,
            required: true,
        },
        summary: {
            type: String,
            default: '',
        },
        overallRating: {
            type: String,
            enum: ['approve', 'request_changes', 'comment'],
            default: 'comment',
        },
        comments: {
            type: [reviewCommentSchema],
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(REVIEW_STATUS),
            default: REVIEW_STATUS.PENDING,
            index: true,
        },
        metrics: {
            type: reviewMetricsSchema,
            default: () => ({}),
        },
        githubReviewId: {
            type: Number,
        },
        deliveryId: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
reviewSchema.index({ repoFullName: 1, prNumber: 1 });
reviewSchema.index({ userId: 1, status: 1 });
reviewSchema.index({ createdAt: -1 });

export const Review = model<IReviewDocument>('Review', reviewSchema);
