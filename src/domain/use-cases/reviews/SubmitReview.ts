import type { Review } from "../../entities/Review";
import type { IReviewRepository, NewReview } from "../../repositories/IReviewRepository";

/**
 * Persist a customer review for a product. The author's name/avatar are snapshotted
 * from the signed-in session by the caller (the route handler) — never trusted from
 * the client — and the rating/comment come from the validated form input.
 */
export class SubmitReview {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  execute(input: NewReview): Promise<Review> {
    return this.reviewRepo.create(input);
  }
}
