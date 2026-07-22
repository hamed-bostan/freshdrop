import type { PublicReview } from "@/src/domain/entities/Review";
import { apiPatch } from "@/src/lib/api/client";
import { reviewResponseSchema } from "@/src/presentation/product/review-response-schema";
import type { ReviewModerationInput } from "@/src/contracts/review-moderation-schema";
import { bulkResultSchema, type BulkResult } from "@/src/contracts/bulk-action-schema";

/**
 * Typed client for the review moderation *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data —
 * validated against `reviewResponseSchema` — or rejects with an `ApiError`.
 * Reads are server-side (see `reviewsServerApi`).
 */
export const reviewsApi = {
  /** Approve or reject a review; resolves with the updated review. */
  setStatus(id: string, values: ReviewModerationInput): Promise<PublicReview> {
    return apiPatch(`/admin/reviews/${id}`, values, reviewResponseSchema);
  },

  /**
   * Approve or reject a selection of reviews. Resolves with how many actually
   * moved — fewer than were selected when some already held that status.
   */
  bulkSetStatus(ids: readonly string[], status: ReviewModerationInput["status"]): Promise<BulkResult> {
    return apiPatch("/admin/reviews/bulk", { ids, status }, bulkResultSchema);
  },
};
