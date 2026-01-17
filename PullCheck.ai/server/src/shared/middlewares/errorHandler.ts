import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors/index.js';
import { logger } from '../../config/logger.js';
import { config } from '../../config/index.js';

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
        stack?: string;
    };
    timestamp: string;
    requestId?: string;
}

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log the error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.headers['x-request-id'],
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        err.errors.forEach((error) => {
            const path = error.path.join('.');
            if (!formattedErrors[path]) {
                formattedErrors[path] = [];
            }
            formattedErrors[path]?.push(error.message);
        });

        const response: ErrorResponse = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: formattedErrors,
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
        };

        res.status(400).json(response);
        return;
    }

    // Handle custom AppError
    if (err instanceof AppError) {
        const response: ErrorResponse = {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err instanceof ValidationError && { details: err.errors }),
                ...(config.NODE_ENV === 'development' && { stack: err.stack }),
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
        };

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        const response: ErrorResponse = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Database validation failed',
                ...(config.NODE_ENV === 'development' && { stack: err.stack }),
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
        };

        res.status(400).json(response);
        return;
    }

    // Handle mongoose cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
        const response: ErrorResponse = {
            success: false,
            error: {
                code: 'INVALID_ID',
                message: 'Invalid resource identifier',
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
        };

        res.status(400).json(response);
        return;
    }

    // Handle duplicate key errors
    if ('code' in err && err.code === 11000) {
        const response: ErrorResponse = {
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Resource already exists',
            },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
        };

        res.status(409).json(response);
        return;
    }

    // Handle unknown errors
    const response: ErrorResponse = {
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: config.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
    };

    res.status(500).json(response);
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const response: ErrorResponse = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
    };

    res.status(404).json(response);
};
