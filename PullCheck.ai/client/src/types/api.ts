// API Response types
export interface ApiResponse<T> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
    requestId?: string;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
    pagination: Pagination;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
    timestamp: string;
    requestId?: string;
}

export interface Pagination {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
