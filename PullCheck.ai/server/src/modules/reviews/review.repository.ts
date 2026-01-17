import { Review, type IReviewDocument } from './review.model.js';
import type { CreateReviewDTO, UpdateReviewDTO } from './review.types.js';
import type { IRepository, QueryOptions, PaginatedResult } from '../../shared/interfaces/index.js';
import { PAGINATION_DEFAULTS } from '../../shared/constants/index.js';

export interface IReviewRepository extends IRepository<IReviewDocument, CreateReviewDTO, UpdateReviewDTO> {
    findByDeliveryId(deliveryId: string): Promise<IReviewDocument | null>;
    findByPR(repoFullName: string, prNumber: number): Promise<IReviewDocument[]>;
    findLatestByPR(repoFullName: string, prNumber: number): Promise<IReviewDocument | null>;
    findByUserAndRepo(userId: string, repoFullName: string, options?: QueryOptions): Promise<PaginatedResult<IReviewDocument>>;
    markCommentAsPosted(reviewId: string, commentId: string): Promise<IReviewDocument | null>;
}

export class ReviewRepository implements IReviewRepository {
    async findById(id: string): Promise<IReviewDocument | null> {
        return Review.findById(id).exec();
    }

    async findOne(filter: Record<string, unknown>): Promise<IReviewDocument | null> {
        return Review.findOne(filter).exec() as Promise<IReviewDocument | null>;
    }

    async findByDeliveryId(deliveryId: string): Promise<IReviewDocument | null> {
        return Review.findOne({ deliveryId }).exec();
    }

    async findByPR(repoFullName: string, prNumber: number): Promise<IReviewDocument[]> {
        return Review.find({ repoFullName, prNumber })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findLatestByPR(repoFullName: string, prNumber: number): Promise<IReviewDocument | null> {
        return Review.findOne({ repoFullName, prNumber })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByUserAndRepo(
        userId: string,
        repoFullName: string,
        options: QueryOptions = {}
    ): Promise<PaginatedResult<IReviewDocument>> {
        const filter = { userId, repoFullName };
        return this.findAllWithFilter(filter, options);
    }

    async findAll(options: QueryOptions = {}): Promise<PaginatedResult<IReviewDocument>> {
        return this.findAllWithFilter({}, options);
    }

    private async findAllWithFilter(
        filter: Record<string, unknown>,
        options: QueryOptions
    ): Promise<PaginatedResult<IReviewDocument>> {
        const {
            page = PAGINATION_DEFAULTS.PAGE,
            limit = PAGINATION_DEFAULTS.LIMIT,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            filter: additionalFilter = {},
        } = options;

        const combinedFilter = { ...filter, ...additionalFilter };
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const [data, totalItems] = await Promise.all([
            Review.find(combinedFilter)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(limit)
                .exec(),
            Review.countDocuments(combinedFilter).exec(),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                totalPages,
                totalItems,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async create(data: CreateReviewDTO): Promise<IReviewDocument> {
        const review = new Review(data);
        return review.save();
    }

    async update(id: string, data: UpdateReviewDTO): Promise<IReviewDocument | null> {
        return Review.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).exec();
    }

    async delete(id: string): Promise<boolean> {
        const result = await Review.findByIdAndDelete(id).exec();
        return result !== null;
    }

    async markCommentAsPosted(reviewId: string, commentId: string): Promise<IReviewDocument | null> {
        return Review.findOneAndUpdate(
            { _id: reviewId, 'comments.id': commentId },
            { $set: { 'comments.$.isPosted': true } },
            { new: true }
        ).exec();
    }
}

export const reviewRepository = new ReviewRepository();
