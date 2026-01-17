import type { Request, Response, NextFunction } from 'express';

// Base repository interface - following Interface Segregation
export interface IReadRepository<T> {
    findById(id: string): Promise<T | null>;
    findAll(options?: QueryOptions): Promise<PaginatedResult<T>>;
    findOne(filter: Record<string, unknown>): Promise<T | null>;
}

export interface IWriteRepository<T, CreateDTO, UpdateDTO> {
    create(data: CreateDTO): Promise<T>;
    update(id: string, data: UpdateDTO): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}

export interface IRepository<T, CreateDTO, UpdateDTO>
    extends IReadRepository<T>,
    IWriteRepository<T, CreateDTO, UpdateDTO> { }

// Query options for pagination and filtering
export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

// Controller type helpers
export type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

// Wrap async handlers to catch errors
export const asyncHandler = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// API Response types
export interface ApiResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
    requestId?: string;
}

export interface ApiListResponse<T = unknown> extends ApiResponse<T[]> {
    pagination: PaginatedResult<T>['pagination'];
}

// Helper to create consistent API responses
export const createResponse = <T>(
    data: T,
    message?: string,
    requestId?: string
): ApiResponse<T> => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
});

export const createListResponse = <T>(
    result: PaginatedResult<T>,
    requestId?: string
): ApiListResponse<T> => ({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
    requestId,
});
