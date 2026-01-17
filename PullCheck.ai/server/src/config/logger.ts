import winston from 'winston';
import { config } from './index.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const simpleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

const developmentFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    simpleFormat
);

const productionFormat = combine(
    timestamp(),
    json()
);

export const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    defaultMeta: { service: 'pullcheck-api' },
    transports: [
        new winston.transports.Console(),
    ],
});

// Stream for Morgan HTTP logging
export const httpLogStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
