import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import {
    globalErrorHandler,
    notFoundHandler,
    requestIdMiddleware,
    requestLogger,
} from './shared/middlewares/index.js';

// Import routes
import { authRoutes } from './modules/auth/index.js';
import { userRoutes } from './modules/users/index.js';
import { reviewRoutes } from './modules/reviews/index.js';
import { webhookRoutes } from './modules/webhooks/index.js';
import { repoRoutes } from './modules/repos/index.js';

export const createServer = async (): Promise<Express> => {
    const app = express();

    // Trust proxy (for rate limiting behind reverse proxy)
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    }));

    // CORS configuration
    app.use(cors({
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression
    app.use(compression());

    // Request ID
    app.use(requestIdMiddleware);

    // Request logging
    app.use(requestLogger);

    // Rate limiting (skip for webhooks and in development)
    const limiter = rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_REQUESTS,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later.',
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => config.NODE_ENV === 'development' || req.path.startsWith('/api/v1/webhooks'),
    });
    app.use(limiter);

    // Body parsing (webhooks have their own parsing for signature verification)
    app.use('/api/v1/webhooks', webhookRoutes);

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Connect to database
    await connectDatabase();

    // API routes
    const apiPrefix = `/api/${config.API_VERSION}`;
    app.use(`${apiPrefix}/auth`, authRoutes);
    app.use(`${apiPrefix}/users`, userRoutes);
    app.use(`${apiPrefix}/reviews`, reviewRoutes);
    app.use(`${apiPrefix}/repos`, repoRoutes);

    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config.NODE_ENV,
            },
        });
    });

    // API documentation endpoint (placeholder)
    app.get(`${apiPrefix}`, (_req, res) => {
        res.json({
            success: true,
            data: {
                name: 'PullCheck API',
                version: config.API_VERSION,
                documentation: `${config.SERVER_URL}/docs`,
                endpoints: {
                    auth: `${apiPrefix}/auth`,
                    users: `${apiPrefix}/users`,
                    reviews: `${apiPrefix}/reviews`,
                    webhooks: `${apiPrefix}/webhooks`,
                },
            },
        });
    });

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler
    app.use(globalErrorHandler);

    return app;
};
