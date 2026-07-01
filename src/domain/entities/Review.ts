/**
 * Moderation state. A review is `pending` when a customer submits it and stays
 * hidden from the storefront until an admin `approved` it from the dashboard;
 * `rejected` dismisses it. Only approved reviews count toward a product's rating.
 */
export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  productId: string;
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
