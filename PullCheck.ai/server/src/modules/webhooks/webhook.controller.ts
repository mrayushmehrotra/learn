import type { Request, Response } from 'express';
import type { IWebhookService } from './webhook.service.js';
import type { WebhookPayload } from './webhook.types.js';
import { asyncHandler, createResponse } from '../../shared/interfaces/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export class WebhookController {
    constructor(private readonly webhookService: IWebhookService) { }

    handleGitHubWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const event = req.headers['x-github-event'] as string;
        const deliveryId = req.headers['x-github-delivery'] as string;
        const signature = req.headers['x-hub-signature-256'] as string;

        // Verify webhook signature
        const rawBody = (req as Request & { rawBody?: string }).rawBody;
        if (!rawBody || !this.webhookService.verifySignature(rawBody, signature)) {
            throw new UnauthorizedError('Invalid webhook signature');
        }

        const payload = req.body as WebhookPayload;

        // Process webhook
        const result = await this.webhookService.processWebhook(event, deliveryId, payload);

        // Acknowledge immediately
        res.status(HTTP_STATUS.OK).json(
            createResponse(result, 'Webhook received', req.requestId)
        );
    });

    // Health check for webhook endpoint
    healthCheck = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        res.status(HTTP_STATUS.OK).json(
            createResponse({ status: 'ok' }, 'Webhook endpoint healthy')
        );
    });
}
