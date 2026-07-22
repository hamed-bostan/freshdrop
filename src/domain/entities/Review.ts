/**
 * Moderation state. A review is `pending` when a customer submits it and stays
 * hidden from the storefront until an admin `approved` it from the dashboard;
 * `rejected` dismisses it. Only approved reviews count toward a product's rating.
 */
export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  productId: string;
  /**
   * The id of the user who wrote it — the identity behind {@link Review.authorName},
   * which is only a display snapshot. `null` on reviews written before reviews were
   * linked to accounts (and on any the backfill couldn't attribute unambiguously),
   * so the admin's per-customer review list is "linked reviews", not "all reviews
   * bearing this name".
   */
  authorId: string | null;
  authorName: string;
  /** Optional avatar; the UI falls back to the author's initials when omitted. */
  authorAvatarUrl?: string;
  /** Star rating, 1–5. */
  rating: number;
  /** ISO timestamp; formatted as relative time ("2 weeks ago") for display. */
  createdAt: string;
  comment: string;
  /** Moderation state; drives the admin queue and storefront visibility. */
  status: ReviewStatus;
}

/**
 * A review as it goes over the wire — everything except who wrote it.
 *
 * `authorId` is a user id, and a user id in this app is the account's normalized
 * phone digits. Serving it alongside a public product review would publish every
 * reviewer's phone number to anyone who opens the network tab. It exists to be
 * *queried* on the server (see `IReviewRepository.listByAuthor`), never to be sent,
 * so every route projects it away with {@link toPublicReview} — including the admin
 * ones, where the caller already knows whose reviews they asked for.
 */
export type PublicReview = Omit<Review, "authorId">;

/** Drop the author's identity, leaving the display snapshot. See {@link PublicReview}. */
export function toPublicReview(review: Review): PublicReview {
  const { authorId: _authorId, ...rest } = review;
  return rest;
}
