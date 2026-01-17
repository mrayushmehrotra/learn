import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, type ReviewQueryParams, type OverrideReviewInput } from '@/services/review.service';

// Query keys
export const reviewKeys = {
    all: ['reviews'] as const,
    lists: () => [...reviewKeys.all, 'list'] as const,
    list: (params: ReviewQueryParams) => [...reviewKeys.lists(), params] as const,
    details: () => [...reviewKeys.all, 'detail'] as const,
    detail: (id: string) => [...reviewKeys.details(), id] as const,
};

// List reviews hook
export function useReviews(params: ReviewQueryParams = {}) {
    return useQuery({
        queryKey: reviewKeys.list(params),
        queryFn: () => reviewService.listReviews(params),
        staleTime: 1000 * 60, // 1 minute
    });
}

// Get single review hook
export function useReview(id: string) {
    return useQuery({
        queryKey: reviewKeys.detail(id),
        queryFn: () => reviewService.getReview(id),
        enabled: !!id,
    });
}

// Override review mutation
export function useOverrideReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: OverrideReviewInput }) =>
            reviewService.overrideReview(id, input),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(reviewKeys.detail(variables.id), data);
            queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
        },
    });
}

// Rerun review mutation
export function useRerunReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => reviewService.rerunReview(id),
        onSuccess: (data, id) => {
            queryClient.setQueryData(reviewKeys.detail(id), data);
            queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
        },
    });
}

// Delete review mutation
export function useDeleteReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => reviewService.deleteReview(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: reviewKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
        },
    });
}
