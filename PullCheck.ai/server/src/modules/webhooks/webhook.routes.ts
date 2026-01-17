import { Router } from 'express';
import express from 'express';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';
import { ReviewService } from '../reviews/review.service.js';
import { reviewRepository } from '../reviews/review.repository.js';
import { githubService } from '../../integrations/github/index.js';
import { claudeService } from '../../integrations/claude/index.js';

// Dependency Injection
const reviewService = new ReviewService(reviewRepository, githubService, claudeService);
const webhookService = new WebhookService(reviewService, githubService);
const webhookController = new WebhookController(webhookService);

const router = Router();

// Preserve raw body for signature verification
router.use(express.json({
    verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
    }
}));

// Webhook routes
router.post('/github', webhookController.handleGitHubWebhook);
router.get('/health', webhookController.healthCheck);

export { router as webhookRoutes };
