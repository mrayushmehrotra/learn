// User types
export interface User {
    id: string;
    githubId: number;
    username: string;
    email: string;
    avatarUrl: string;
    connectedRepos: ConnectedRepo[];
    settings: UserSettings;
    createdAt: string;
    updatedAt: string;
}

export interface ConnectedRepo {
    repoId: number;
    fullName: string;
    webhookId?: number;
    isActive: boolean;
    connectedAt: string;
}

export interface UserSettings {
    autoReview: boolean;
    reviewOnDraft: boolean;
    notifyOnComplete: boolean;
}

// Review types
export interface Review {
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
    comments: ReviewComment[];
    status: ReviewStatus;
    metrics: ReviewMetrics;
    githubReviewId?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewComment {
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

export interface ReviewMetrics {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    suggestionCount: number;
    totalComments: number;
    filesReviewed: number;
    processingTimeMs: number;
}

export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'overridden';
export type Severity = 'critical' | 'warning' | 'info' | 'suggestion';

// Repository types
export interface Repository {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string;
    isConnected?: boolean;
}

// Auth types
export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}
