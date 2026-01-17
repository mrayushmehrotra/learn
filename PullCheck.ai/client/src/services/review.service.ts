import api from './api';
import type { Review } from '@/types';
import type { ApiResponse, ApiListResponse, PaginationParams } from '@/types/api';

export interface ReviewQueryParams extends PaginationParams {
    repoFullName?: string;
    status?: string;
}

export interface OverrideCommentInput {
    commentId: string;
    message: string;
}

export interface OverrideReviewInput {
    comments: OverrideCommentInput[];
    postToGitHub?: boolean;
}

export const reviewService = {
    // List reviews
    async listReviews(params: ReviewQueryParams = {}): Promise<ApiListResponse<Review>> {
        const response = await api.get<ApiListResponse<Review>>('/reviews', { params });
        return response.data;
    },

    // Get single review
    async getReview(id: string): Promise<Review> {
        const response = await api.get<ApiResponse<Review>>(`/reviews/${id}`);
        return response.data.data;
    },

    // Override review comments
    async overrideReview(id: string, input: OverrideReviewInput): Promise<Review> {
        const response = await api.post<ApiResponse<Review>>(`/reviews/${id}/override`, input);
        return response.data.data;
    },

    // Rerun review
    async rerunReview(id: string): Promise<Review> {
        const response = await api.post<ApiResponse<Review>>(`/reviews/${id}/rerun`);
        return response.data.data;
    },

    // Delete review
    async deleteReview(id: string): Promise<void> {
        await api.delete(`/reviews/${id}`);
    },
};

export default reviewService;
