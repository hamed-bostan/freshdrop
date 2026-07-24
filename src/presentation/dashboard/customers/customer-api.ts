import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { apiGet } from "@/src/lib/api/client";
import { customerOrderSummaryPageResponseSchema } from "./customer-response-schema";

/** How many matches a picker shows. Enough to choose from, few enough to read. */
const SEARCH_LIMIT = 8;

/**
 * Typed browser client for the admin customer reads.
 *
 * Only a search: the customers *list* is server-rendered from
 * `customersServerApi` like every other list, and this exists for the one case a
 * server render can't serve — a picker that has to answer while someone is typing
 * into a form they haven't submitted, where a navigation would throw the rest of
 * the form away.
 */
export const customersApi = {
  /**
   * Customers whose name or phone matches `query`, capped at a handful.
   *
   * Returns the page's items and drops the total: a picker offers what it can
   * show, and "8 of 340" is a fact nobody choosing a customer needs.
   */
  async search(query: string): Promise<CustomerOrderSummary[]> {
    const page = await apiGet("/admin/customers", customerOrderSummaryPageResponseSchema, {
      params: { q: query, pageSize: SEARCH_LIMIT },
    });
    return page.items;
  },
};
