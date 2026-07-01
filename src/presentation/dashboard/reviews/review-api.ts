import type { Review } from "@/src/domain/entities/Review";
import { apiClient } from "@/src/lib/api/client";
import type { ReviewModerationInput } from "./review-moderation-schema";

/**
 * Typed client for the review moderation *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data or
 * rejects with an `ApiError` (normalized by the Axios response interceptor in
 * `client.ts`). Reads are server-side (see `reviewsServerApi`).
 */
export const reviewsApi = {
  /** Approve or reject a review; resolves with the updated review. */
  async setStatus(id: string, values: ReviewModerationInput): Promise<Review> {
    const { data } = await apiClient.patch<Review>(`/admin/reviews/${id}`, values);
    return data;
  },
};
