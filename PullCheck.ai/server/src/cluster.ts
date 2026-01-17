import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { createServer } from './server.js';
import { disconnectDatabase } from './config/database.js';

const numCPUs = os.cpus().length;

// Determine number of workers (use fewer in development)
const numWorkers = config.NODE_ENV === 'production' ? numCPUs : Math.min(2, numCPUs);

if (cluster.isPrimary) {
    logger.info(`🚀 Primary process ${process.pid} is running`);
    logger.info(`📊 Environment: ${config.NODE_ENV}`);
    logger.info(`💻 CPU cores available: ${numCPUs}`);
    logger.info(`🔄 Forking ${numWorkers} workers...`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);

        // Restart worker if it crashed (not if it was killed)
        if (code !== 0 && !worker.exitedAfterDisconnect) {
            logger.info('Starting a new worker...');
            cluster.fork();
        }
    });

    // Handle worker online
    cluster.on('online', (worker) => {
        logger.info(`Worker ${worker.process.pid} is online`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
        logger.info(`\n${signal} received. Shutting down gracefully...`);

        // Disconnect all workers
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            if (worker) {
                worker.send('shutdown');
                worker.disconnect();
            }
        }

        // Wait for workers to finish (with timeout)
        const timeout = setTimeout(() => {
            logger.warn('Shutdown timeout - forcing exit');
            process.exit(1);
        }, 30000);

        // Wait for all workers to exit
        const checkWorkersInterval = setInterval(() => {
            const activeWorkers = Object.keys(cluster.workers ?? {}).length;
            if (activeWorkers === 0) {
                clearInterval(checkWorkersInterval);
                clearTimeout(timeout);
                logger.info('All workers have exited. Primary process exiting.');
                process.exit(0);
            }
        }, 100);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

} else {
    // Worker process
    const startWorker = async () => {
        try {
            const app = await createServer();

            const server = app.listen(config.PORT, () => {
                logger.info(`🔧 Worker ${process.pid} listening on port ${config.PORT}`);
            });

            // Handle shutdown message from primary
            process.on('message', async (msg) => {
                if (msg === 'shutdown') {
                    logger.info(`Worker ${process.pid} received shutdown signal`);

                    server.close(async () => {
                        await disconnectDatabase();
                        logger.info(`Worker ${process.pid} closed gracefully`);
                        process.exit(0);
                    });
                }
            });

            // Handle uncaught exceptions in worker
            process.on('uncaughtException', (error) => {
                logger.error(`Uncaught exception in worker ${process.pid}:`, error);

                // Close server and exit
                server.close(async () => {
                    await disconnectDatabase();
                    process.exit(1);
                });

                // Force exit after timeout
                setTimeout(() => process.exit(1), 5000);
            });

            process.on('unhandledRejection', (reason, promise) => {
                logger.error(`Unhandled rejection in worker ${process.pid}:`, { reason, promise });
            });

        } catch (error) {
            logger.error(`Failed to start worker ${process.pid}:`, error);
            process.exit(1);
        }
    };

    startWorker();
}
