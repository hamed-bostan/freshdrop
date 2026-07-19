import type { Page } from "./Pagination";
import type { Review, ReviewStatus } from "./Review";

/** Filter and sort vocabulary for the admin review moderation queue. */

/** Columns the queue can be ordered by. */
export const ADMIN_REVIEW_SORTS = ["createdAt", "rating"] as const;
export type AdminReviewSort = (typeof ADMIN_REVIEW_SORTS)[number];

/** Newest first — the queue is worked front to back as reviews come in. */
export const DEFAULT_ADMIN_REVIEW_SORT: AdminReviewSort = "createdAt";
export const DEFAULT_ADMIN_REVIEW_DIRECTION = "desc";

export type AdminReviewFilters = {
  /** Free-text term matched against the comment and the author's name. */
  query?: string;
  status?: ReviewStatus;
};

/** How many reviews sit in each moderation state, plus the total across all of them. */
export type ReviewStatusCounts = Record<ReviewStatus | "all", number>;

/**
 * A page of the moderation queue, carrying the per-status counts alongside.
 *
 * The counts ride with the page because the status tabs show them, and they
 * describe the *whole* queue rather than the slice on screen — derived from the
 * page's items they'd read "3 pending" whenever page 1 happened to hold three.
 * They're also unaffected by the active status filter, so switching tabs never
 * makes the other tabs' numbers vanish.
 */
export type ReviewPage = Page<Review> & { counts: ReviewStatusCounts };
