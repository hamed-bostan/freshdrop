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
}
