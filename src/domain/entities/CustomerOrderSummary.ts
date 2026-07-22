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
  /**
   * Contact email from the profile, when they've given one.
   *
   * Carried because it's the difference between a channel being available and not:
   * the dashboard's order comms can email a customer a one-off note, and the panel
   * needs to know whether to offer that before the admin has typed anything. The
   * user row is already read to build this summary, so it costs nothing extra.
   */
  email: string | null;
  /** Profile avatar URL, when set. */
  avatarUrl: string | null;
  /** How many orders the customer has placed. */
  orderCount: number;
  /** Sum of every order total, in the store currency — the ranking key. */
  totalSpent: number;
  /** ISO 8601 timestamp (UTC) of the customer's most recent order. */
  lastOrderAt: string;
  /**
   * 1-based position in the *full* spend ranking, assigned before any search or
   * paging narrows the list — so customer #4 stays #4 on page 2 and in a filtered
   * result. Carried on the summary rather than derived from the row's index,
   * which only equals the rank on an unfiltered first page.
   */
  rank: number;
}
