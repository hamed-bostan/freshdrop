import type { Review } from "../entities/Review";

export type IReviewRepository = {
  getByProduct(productId: string): Promise<Review[]>;
}
