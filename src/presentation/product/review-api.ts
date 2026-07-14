import type { Review } from "@/src/domain/entities/Review";
import { apiPost } from "@/src/lib/api/client";
import { reviewResponseSchema } from "./review-response-schema";
import type { ReviewSubmissionInput } from "./components/review-schema";

/**
 * Typed client for the review REST *mutations*. UI components call these instead of
 * touching Axios directly; each method resolves with domain data — validated against
 * `reviewResponseSchema` — or rejects with an `ApiError`. Reads are server-side
 * (see `reviewsServerApi`).
 */
export const reviewsApi = {
  create(input: ReviewSubmissionInput): Promise<Review> {
    return apiPost("/reviews", input, reviewResponseSchema);
  },
};
