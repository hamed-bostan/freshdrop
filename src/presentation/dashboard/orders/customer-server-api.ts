import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side customer-analytics read for the admin dashboard (BFF). Returns the
 * per-customer order summaries ranked by total spend — for the Orders page's
 * "top customers" panel and the table's customer column. `serverApiGet` forwards
 * the admin's session cookie so the admin endpoint authorizes the call.
 */
export const customersServerApi = {
  listSummaries(): Promise<CustomerOrderSummary[]> {
    return serverApiGet<CustomerOrderSummary[]>("/admin/customers");
  },
};
