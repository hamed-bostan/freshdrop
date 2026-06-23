import type { Review } from "../../entities/Review";
import type { IReviewRepository } from "../../repositories/IReviewRepository";

export class GetProductReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  execute(productId: string): Promise<Review[]> {
    return this.reviewRepo.getByProduct(productId);
  }
}
