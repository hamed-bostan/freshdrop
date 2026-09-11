import type { DeliveryType, PaymentStatus } from "./Order";
import type { OrderPipelineStage } from "./OrderPipelineStage";

/**
 * Filter and sort vocabulary for the admin order-tracking list.
 *
 * The storefront has no equivalent — a customer's own order list is short enough
 * to read whole and is grouped by `phase`, not filtered — so unlike the product
 * lists there's no second vocabulary to keep this from colliding with.
 */

/** Columns the order list can be ordered by; each maps to a single column in the repository. */
export const ADMIN_ORDER_SORTS = ["placedAt", "total"] as const;
export type AdminOrderSort = (typeof ADMIN_ORDER_SORTS)[number];

/** Newest first — the tracking table's job is "what came in and what's still moving". */
export const DEFAULT_ADMIN_ORDER_SORT: AdminOrderSort = "placedAt";
export const DEFAULT_ADMIN_ORDER_DIRECTION = "desc";

export type AdminOrderFilters = {
  /**
   * Free-text term, matched against the order id — and, via `userIds`, against
   * who placed it.
   */
  query?: string;
  /**
   * Customers the term resolved to, matched as an *alternative* to the id: an
   * order is a hit if its id looks like the term **or** it was placed by one of
   * these users.
   *
   * Not a filter anyone sets. It's derived from `query` by `resolveOrderSearch`
   * before the filters reach a repository, and never parsed from the URL — the
   * wire contract carries the term the operator typed, not the ids it happened to
   * resolve to on one request. Orders reference a user with no DB foreign key
   * (the schema's deliberate loose coupling), so this indirection is what a join
   * would otherwise be.
   */
  userIds?: string[];
  /**
   * Where the order is in the queue, as one flat vocabulary rather than the
   * `status`/`stage` pair it resolves to — see {@link OrderPipelineStage} for why
   * the two fields are merged here and not offered separately.
   */
  pipeline?: OrderPipelineStage;
  deliveryType?: DeliveryType;
  paymentStatus?: PaymentStatus;
  /**
   * Inclusive bounds on `placedAt`, as ISO 8601 instants. Half-open ranges are
   * meaningful and supported: "everything since Monday" sets only `placedFrom`.
   *
   * Instants rather than calendar dates because the boundary has to be resolved
   * against *a* timezone and the repository has no business picking one — the
   * caller that knows the operator's zone turns "today" into the two instants
   * that bracket it (see `admin-order-params`).
   */
  placedFrom?: string;
  placedTo?: string;
  /** Inclusive bounds on the order total, in the store's currency. */
  minTotal?: number;
  maxTotal?: number;
};

/**
 * Whether anything is narrowing the list — what tells "no orders yet" apart from
 * "no orders match", and what decides if the toolbar's Reset is worth offering.
 *
 * A function rather than a check at each call site because the filter set is now
 * wide enough that an inline `a != null || b != null` chain is a standing
 * invitation to forget the field someone added last.
 */
export function hasAdminOrderFilters(filters: AdminOrderFilters): boolean {
  return Object.values(filters).some((value) => value != null);
}
