import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';
import { reviewRepository } from './review.repository.js';
import { githubService } from '../../integrations/github/index.js';
import { claudeService } from '../../integrations/claude/index.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, mongoIdSchema } from '../../shared/middlewares/validate.js';
import { reviewQuerySchema, overrideReviewSchema } from './review.types.js';

// Dependency Injection
const reviewService = new ReviewService(reviewRepository, githubService, claudeService);
const reviewController = new ReviewController(reviewService);

const router = Router();

// All routes require authentication
router.use(authenticate);

// Review routes
router.get('/', validate({ query: reviewQuerySchema }), reviewController.listReviews);
router.get('/:id', validate({ params: mongoIdSchema }), reviewController.getReview);
router.post('/:id/override', validate({ params: mongoIdSchema, body: overrideReviewSchema }), reviewController.overrideReview);
router.post('/:id/rerun', validate({ params: mongoIdSchema }), reviewController.rerunReview);
router.delete('/:id', validate({ params: mongoIdSchema }), reviewController.deleteReview);

export { router as reviewRoutes };
