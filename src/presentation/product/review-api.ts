import type { Review } from "@/src/domain/entities/Review";
import { apiClient } from "@/src/lib/api/client";
import type { ReviewSubmissionInput } from "./components/review-schema";

/**
 * Typed client for the review REST *mutations*. UI components call these instead of
 * touching Axios directly; each method resolves with domain data or rejects with an
 * `ApiError` (normalized by the Axios response interceptor in `client.ts`). Reads
 * are server-side (see `reviewsServerApi`).
 */
export const reviewsApi = {
  async create(input: ReviewSubmissionInput): Promise<Review> {
    const { data } = await apiClient.post<Review>("/reviews", input);
    return data;
  },
};
