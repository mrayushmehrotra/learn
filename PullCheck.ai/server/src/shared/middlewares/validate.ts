import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodSchema } from 'zod';

interface ValidatorSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

export const validate = (schemas: ValidatorSchemas): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Common validation schemas
export const paginationSchema = z.object({
    page: z.string().optional().transform((val) => parseInt(val ?? '1', 10)),
    limit: z.string().optional().transform((val) => Math.min(parseInt(val ?? '10', 10), 100)),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const mongoIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
