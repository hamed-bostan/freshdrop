import type { Review, ReviewStatus } from "../../entities/Review";
import type { IReviewRepository } from "../../repositories/IReviewRepository";

/**
 * Every review across products for the admin moderation queue, newest first —
 * optionally narrowed to a single status. Unlike `GetProductReviews` (the public,
 * approved-only storefront list), this returns reviews in every state.
 */
export class ListReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  execute(status?: ReviewStatus): Promise<Review[]> {
    return this.reviewRepo.listByStatus(status);
  }
}
