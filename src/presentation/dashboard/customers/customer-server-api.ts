import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Page } from "@/src/domain/entities/Pagination";
import { serverApiGet } from "@/src/lib/api/server-client";
import { customerOrderSummaryPageResponseSchema } from "./customer-response-schema";

/**
 * Server-side customer-analytics reads for the admin dashboard (BFF). Returns the
 * per-customer order summaries ranked by total spend — powering the Customers page,
 * the overview's "top customers" panel, and the Orders table's customer column.
 * `serverApiGet` forwards the admin's session cookie so the admin endpoint authorizes
 * the call.
 */
export const customersServerApi = {
  /** One page of the customers list, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<Page<CustomerOrderSummary>> {
    return serverApiGet("/admin/customers", customerOrderSummaryPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },

  /**
   * The top spenders, for the overview's panel — the list's default ordering, so
   * this is just its first page.
   */
  listTop(count: number): Promise<Page<CustomerOrderSummary>> {
    return this.listPage(new URLSearchParams({ page: "1", pageSize: String(count) }));
  },

  /**
   * Summaries for specific customers, to label a page of orders with who placed
   * them. `pageSize` matches the id count so a single page covers all of them.
   */
  listByIds(userIds: readonly string[]): Promise<Page<CustomerOrderSummary>> {
    // No ids means nothing to label. Left to the endpoint, an empty `ids` would
    // read as "no filter" and answer with a default page of arbitrary customers.
    if (userIds.length === 0) {
      return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 0 });
    }
    return this.listPage(
      new URLSearchParams({ ids: userIds.join(","), page: "1", pageSize: String(userIds.length) }),
    );
  },
};
