import type { Review } from "../entities/Review";

export interface IReviewRepository {
  getByProduct(productId: string): Promise<Review[]>;
}
