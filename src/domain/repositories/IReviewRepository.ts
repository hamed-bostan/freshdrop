import type { Review } from "../entities/Review";

/** A new review to persist. The id and timestamp are assigned by the repository. */
export type NewReview = Omit<Review, "id" | "createdAt">;

export type IReviewRepository = {
  getByProduct(productId: string): Promise<Review[]>;
  create(input: NewReview): Promise<Review>;
}
