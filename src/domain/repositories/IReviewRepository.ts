import type { Review, ReviewStatus } from "../entities/Review";

/**
 * A new review to persist. The id, timestamp and moderation status are assigned by
 * the repository (new reviews always start `pending`).
 */
export type NewReview = Omit<Review, "id" | "createdAt" | "status">;

export type IReviewRepository = {
  /** Approved reviews for a product, newest first — the public storefront list. */
  getByProduct(productId: string): Promise<Review[]>;
  /**
   * Every review across all products for the admin moderation queue, newest first.
   * Optionally narrowed to a single status (e.g. the `pending` queue).
   */
  listByStatus(status?: ReviewStatus): Promise<Review[]>;
  create(input: NewReview): Promise<Review>;
  /**
   * Set a review's moderation status and recompute the product's rating (only
   * approved reviews count). Throws `NotFoundError` when the id doesn't match.
   */
  updateStatus(id: string, status: ReviewStatus): Promise<Review>;
}
