import { z } from 'zod';

export interface WebhookPayload {
    action: string;
    number?: number;
    pull_request?: {
        id: number;
        number: number;
        title: string;
        body: string | null;
        html_url: string;
        head: {
            sha: string;
            ref: string;
        };
        base: {
            ref: string;
        };
        user: {
            id: number;
            login: string;
        };
        draft?: boolean;
    };
    repository?: {
        id: number;
        name: string;
        full_name: string;
        owner: {
            id: number;
            login: string;
        };
    };
    sender?: {
        id: number;
        login: string;
    };
    installation?: {
        id: number;
    };
}

export interface ProcessedWebhook {
    event: string;
    action: string;
    deliveryId: string;
    repoFullName: string;
    prNumber: number;
    processed: boolean;
    reviewId?: string;
}

// Validation schema for webhook headers
export const webhookHeadersSchema = z.object({
    'x-github-event': z.string().min(1),
    'x-github-delivery': z.string().min(1),
    'x-hub-signature-256': z.string().min(1),
});
