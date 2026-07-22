import type { AdminReviewFilters, AdminReviewSort, ReviewPage } from "../entities/AdminReviewFilters";
import type { PageRequest } from "../entities/Pagination";
import type { Review, ReviewStatus } from "../entities/Review";
import type { AuditHook } from "./AuditHook";

/**
 * A new review to persist. The id, timestamp and moderation status are assigned by
 * the repository (new reviews always start `pending`).
 */
export type NewReview = Omit<Review, "id" | "createdAt" | "status">;

export type IReviewRepository = {
  /** Approved reviews for a product, newest first — the public storefront list. */
  getByProduct(productId: string): Promise<Review[]>;
  /**
   * One review in any status, or `null`. Admin-side: it's what `ModerateReview`
   * reads to record the status a review was in *before* it moderated it, which
   * `updateStatus` can't answer since it resolves the row as written.
   */
  getById(id: string): Promise<Review | null>;
  /**
   * One page of the moderation queue, plus the total matching the filters and the
   * per-status counts the tabs display (see {@link ReviewPage}).
   */
  listPage(filters: AdminReviewFilters, page: PageRequest<AdminReviewSort>): Promise<ReviewPage>;
  /**
   * Everything one user has reviewed, newest first, in every moderation status —
   * the admin's per-customer view, where a pending or rejected review is exactly
   * what the admin came to look at. Matched on `authorId`, so reviews the backfill
   * left unlinked don't appear (see {@link Review.authorId}).
   */
  listByAuthor(authorId: string): Promise<Review[]>;
  create(input: NewReview): Promise<Review>;
  /**
   * Set a review's moderation status and recompute the product's rating (only
   * approved reviews count). Throws `NotFoundError` when the id doesn't match.
   */
  updateStatus(id: string, status: ReviewStatus, audit?: AuditHook<Review>): Promise<Review>;
}
