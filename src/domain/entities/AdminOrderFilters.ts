import type { OrderStatus } from "./Order";

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
   * Free-text term matched against the order id.
   *
   * Not against the customer's name: orders reference a user by id with no DB
   * foreign key (the schema's deliberate loose coupling), so a name search would
   * mean resolving users first and passing a possibly-huge id list into the
   * query. Searching customers by name belongs on the customers list, which can
   * then link through to the orders — that's Phase 6's customer detail page.
   */
  query?: string;
  status?: OrderStatus;
};
