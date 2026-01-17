import { createServer } from './server.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { disconnectDatabase } from './config/database.js';

// Single-process entry point (for development or single-core deployments)
const start = async () => {
    try {
        const app = await createServer();

        const server = app.listen(config.PORT, () => {
            logger.info(`🚀 Server running on port ${config.PORT}`);
            logger.info(`📊 Environment: ${config.NODE_ENV}`);
            logger.info(`🔗 API: ${config.SERVER_URL}/api/${config.API_VERSION}`);
            logger.info(`❤️  Health: ${config.SERVER_URL}/health`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal: string) => {
            logger.info(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed');
                await disconnectDatabase();
                logger.info('Database disconnected');
                process.exit(0);
            });

            // Force exit after timeout
            setTimeout(() => {
                logger.error('Shutdown timeout - forcing exit');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection:', { reason, promise });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();
