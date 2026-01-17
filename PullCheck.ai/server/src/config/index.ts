import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    API_VERSION: z.string().default('v1'),

    // Database
    MONGO_URI: z.string().url().default('mongodb://localhost:27017/pullcheck'),
    MONGO_DB_NAME: z.string().default('pullcheck'),

    // GitHub OAuth
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_WEBHOOK_SECRET: z.string().min(1),

    // Claude API
    ANTHROPIC_API_KEY: z.string().min(1),
    CLAUDE_MODEL: z.string().default('claude-3-sonnet-20240229'),
    CLAUDE_MAX_TOKENS: z.string().transform(Number).default('4096'),

    // Security
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    ENCRYPTION_KEY: z.string().min(32),

    // URLs
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    SERVER_URL: z.string().url().default('http://localhost:3000'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.format());
        process.exit(1);
    }

    return result.data;
};

export const config = parseEnv();

export type Config = typeof config;
