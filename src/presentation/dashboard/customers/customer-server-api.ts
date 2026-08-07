import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Page } from "@/src/domain/entities/Pagination";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

import { customerDetailResponseSchema } from "./customer-detail-response-schema";
import { customerOrderSummaryPageResponseSchema } from "./customer-response-schema";

/**
 * Server-side customer-analytics reads for the admin dashboard (BFF). Returns the
 * per-customer order summaries ranked by total spend — powering the Customers page
 * and the Orders table's customer column. `serverApiGet` forwards the admin's
 * session cookie so the admin endpoint authorizes the call.
 */
export const customersServerApi = {
  /** One page of the customers list, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<Page<CustomerOrderSummary>> {
    return serverApiGet("/admin/customers", customerOrderSummaryPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },

  /**
   * Everything about one customer — profile, lifetime figures, orders, addresses,
   * wallet and reviews — for the detail page. Returns `null` for an id that names
   * nobody (404) so the page can `notFound()`.
   *
   * Not derived from `listPage`: that ranks every customer by aggregating the whole
   * order history, which is a lot of work to answer a question about one person.
   * This is its own endpoint reading only that person's rows.
   */
  async getById(userId: string): Promise<CustomerDetail | null> {
    try {
      return await serverApiGet(`/admin/customers/${userId}`, customerDetailResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
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
