import type { Request, Response } from 'express';
import type { IReviewService } from './review.service.js';
import type { ReviewQuery, OverrideReviewInput } from './review.types.js';
import { asyncHandler, createResponse, createListResponse } from '../../shared/interfaces/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export class ReviewController {
    constructor(private readonly reviewService: IReviewService) { }

    listReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const { page, limit, repoFullName, status } = req.query as unknown as ReviewQuery;

        const result = await this.reviewService.getReviewsByUser(userId, {
            page,
            limit,
            repoFullName,
            status,
        });

        res.status(HTTP_STATUS.OK).json(createListResponse(result, req.requestId));
    });

    getReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const review = await this.reviewService.getReviewById(id!);
        res.status(HTTP_STATUS.OK).json(createResponse(review, 'Review retrieved successfully', req.requestId));
    });

    overrideReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const input = req.body as OverrideReviewInput;

        const review = await this.reviewService.overrideReview(id!, input);
        res.status(HTTP_STATUS.OK).json(createResponse(review, 'Review overridden successfully', req.requestId));
    });

    rerunReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const review = await this.reviewService.rerunReview(id!);
        res.status(HTTP_STATUS.OK).json(createResponse(review, 'Review rerun initiated', req.requestId));
    });

    deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        await this.reviewService.deleteReview(id!);
        res.status(HTTP_STATUS.NO_CONTENT).send();
    });
}
