import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { userRepository } from '../users/user.repository.js';

// Augment Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                githubId: number;
                username: string;
            };
        }
    }
}

interface JWTPayload {
    userId: string;
    githubId: number;
    username: string;
    iat: number;
    exp: number;
}

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

        // Verify user still exists
        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            throw new UnauthorizedError('User no longer exists');
        }

        req.user = {
            id: decoded.userId,
            githubId: decoded.githubId,
            username: decoded.username,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token'));
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expired'));
            return;
        }
        next(error);
    }
};

export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

        req.user = {
            id: decoded.userId,
            githubId: decoded.githubId,
            username: decoded.username,
        };

        next();
    } catch {
        // Silently continue without auth
        next();
    }
};
