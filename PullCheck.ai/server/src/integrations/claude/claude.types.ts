import type { Severity } from '../../shared/constants/index.js';

export interface AIReviewRequest {
    prTitle: string;
    prDescription: string;
    baseBranch: string;
    headBranch: string;
    diff: string;
}

export interface AIReviewComment {
    filePath: string;
    lineNumber: number | null;
    severity: Severity;
    category: string;
    message: string;
    codeSnippet: string | null;
}

export interface AIReviewResult {
    summary: string;
    overallRating: 'approve' | 'request_changes' | 'comment';
    comments: AIReviewComment[];
}
