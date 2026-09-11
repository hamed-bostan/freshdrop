/** Filter and sort vocabulary for the admin customers list. */

/** Columns the customers list can be ordered by. */
export const ADMIN_CUSTOMER_SORTS = ["totalSpent", "orderCount", "lastOrderAt"] as const;
export type AdminCustomerSort = (typeof ADMIN_CUSTOMER_SORTS)[number];

/** Highest spend first — the "top customers" ranking the page is built around. */
export const DEFAULT_ADMIN_CUSTOMER_SORT: AdminCustomerSort = "totalSpent";
export const DEFAULT_ADMIN_CUSTOMER_DIRECTION = "desc";

export type AdminCustomerFilters = {
  /** Free-text term matched against the customer's name and phone. */
  query?: string;
  /**
   * Narrow to specific customers by user id — the lookup the orders table needs to
   * label a page of orders with who placed them, without pulling every customer
   * to build the map.
   */
  userIds?: string[];
};
