import type { DeliveryLocation } from "./DeliveryLocation";
import type { Order } from "./Order";
import type { PublicReview } from "./Review";
import type { UserRole } from "./User";
import type { Wallet } from "./Wallet";

/**
 * What one customer is worth, derived from their own order history.
 *
 * Deliberately *not* a {@link CustomerOrderSummary}: that type carries `rank`, which
 * only means anything once every customer's spend has been computed, so producing it
 * costs a read of the whole order history. This page is about one person, and one
 * person's totals come from one person's orders — so it answers more (average order
 * value, when they first ordered) for less.
 */
export type CustomerLifetime = {
  orderCount: number;
  /** Sum of every order total, in the store currency. */
  totalSpent: number;
  /** `totalSpent / orderCount`, or `0` when they've never ordered. */
  averageOrderValue: number;
  /** ISO 8601 timestamp (UTC) of their first order; `null` when they've never ordered. */
  firstOrderAt: string | null;
  /** ISO 8601 timestamp (UTC) of their most recent order; `null` when they've never ordered. */
  lastOrderAt: string | null;
};

/**
 * Everything the dashboard shows about one customer, assembled per request from the
 * profile, the order history, the saved addresses, the wallet and the reviews they
 * wrote. A read model, never persisted — the parts each remain owned by their own
 * repository, and this is only the shape the detail page needs them in.
 *
 * `name`/`phone` come from the profile when there is one. A customer can exist with
 * orders but no user row (seed and demo orders reference ids that were never signed
 * up), which is why {@link CustomerDetail.hasProfile} is carried explicitly rather
 * than left to be inferred from a placeholder name.
 */
export type CustomerDetail = {
  /** The customer's user id — the `userId` carried on their orders. */
  userId: string;
  /** Display name from the profile, falling back to the raw id when there's no user row. */
  name: string;
  /** Contact phone from the profile; empty string when unknown. */
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  /** Access level, so the admin can see at a glance that they're looking at a colleague. */
  role: UserRole;
  /** False when orders reference this id but no user row backs it. */
  hasProfile: boolean;
  lifetime: CustomerLifetime;
  /** Their full order history, newest first. */
  orders: Order[];
  /** Their saved delivery addresses. */
  addresses: DeliveryLocation[];
  /** Balance, saved cards and recent wallet activity. */
  wallet: Wallet;
  /**
   * Reviews they wrote, newest first, in every moderation status. {@link PublicReview}
   * because the author is the customer this page is already about — repeating their
   * id on each row would only put their phone digits on the wire again.
   */
  reviews: PublicReview[];
};
