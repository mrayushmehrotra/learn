export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const;

export const REVIEW_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    OVERRIDDEN: 'overridden',
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

export const SEVERITY = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info',
    SUGGESTION: 'suggestion',
} as const;

export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export const GITHUB_EVENTS = {
    PULL_REQUEST_OPENED: 'pull_request.opened',
    PULL_REQUEST_SYNCHRONIZE: 'pull_request.synchronize',
    PULL_REQUEST_REOPENED: 'pull_request.reopened',
    PULL_REQUEST_CLOSED: 'pull_request.closed',
} as const;

export const TOKEN_EXPIRY = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
} as const;

export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
} as const;
