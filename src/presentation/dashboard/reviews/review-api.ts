import type { Review } from "@/src/domain/entities/Review";
import { apiPatch } from "@/src/lib/api/client";
import { reviewResponseSchema } from "@/src/presentation/product/review-response-schema";
import type { ReviewModerationInput } from "./review-moderation-schema";

/**
 * Typed client for the review moderation *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data —
 * validated against `reviewResponseSchema` — or rejects with an `ApiError`.
 * Reads are server-side (see `reviewsServerApi`).
 */
export const reviewsApi = {
  /** Approve or reject a review; resolves with the updated review. */
  setStatus(id: string, values: ReviewModerationInput): Promise<Review> {
    return apiPatch(`/admin/reviews/${id}`, values, reviewResponseSchema);
  },
};
