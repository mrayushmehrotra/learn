export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    default_branch: string;
    permissions?: {
        admin: boolean;
        push: boolean;
        pull: boolean;
    };
}

export interface GitHubPullRequest {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    html_url: string;
    head: {
        sha: string;
        ref: string;
        repo: {
            full_name: string;
        };
    };
    base: {
        sha: string;
        ref: string;
        repo: {
            full_name: string;
        };
    };
    user: {
        id: number;
        login: string;
        avatar_url: string;
    };
    draft: boolean;
    created_at: string;
    updated_at: string;
}

export interface GitHubReviewComment {
    path: string;
    position?: number;
    line?: number;
    body: string;
}

export interface GitHubReview {
    id: number;
    body: string;
    state: string;
    html_url: string;
}

export interface CreateWebhookParams {
    repoFullName: string;
    events: string[];
    secret: string;
    url: string;
}
