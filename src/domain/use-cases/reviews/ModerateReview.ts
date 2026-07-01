import type { Review, ReviewStatus } from "../../entities/Review";
import type { IReviewRepository } from "../../repositories/IReviewRepository";

/**
 * Set a review's moderation status (admin). Approving a review reveals it on the
 * storefront and folds it into the product's rating; rejecting hides it. The
 * repository recomputes the product's rating so it always reflects approved reviews.
 */
export class ModerateReview {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  execute(id: string, status: ReviewStatus): Promise<Review> {
    return this.reviewRepo.updateStatus(id, status);
  }
}
