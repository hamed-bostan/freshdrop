/**
 * Aggregated ordering activity for one customer — powers the dashboard's
 * "top customers" ranking and labels each order with who placed it. Derived at
 * read time from the order history (grouped by user) joined with the user's
 * profile; never persisted.
 */
export type CustomerOrderSummary = {
  /** The customer's user id — the `userId` carried on their orders. */
  userId: string;
  /** Display name from the profile; falls back to the raw id when no user row exists (e.g. seed/demo orders). */
  name: string;
  /** Contact phone from the profile; empty string when unknown. */
  phone: string;
  /** Profile avatar URL, when set. */
  avatarUrl: string | null;
  /** How many orders the customer has placed. */
  orderCount: number;
  /** Sum of every order total, in the store currency — the ranking key. */
  totalSpent: number;
  /** ISO 8601 timestamp (UTC) of the customer's most recent order. */
  lastOrderAt: string;
}
