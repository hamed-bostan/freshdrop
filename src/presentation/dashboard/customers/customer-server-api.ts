import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { serverApiGet } from "@/src/lib/api/server-client";
import { customerOrderSummaryListResponseSchema } from "./customer-response-schema";

/**
 * Server-side customer-analytics read for the admin dashboard (BFF). Returns the
 * per-customer order summaries ranked by total spend — powering the Customers page,
 * the overview's "top customers" panel, and the Orders table's customer column.
 * `serverApiGet` forwards the admin's session cookie so the admin endpoint authorizes
 * the call.
 */
export const customersServerApi = {
  listSummaries(): Promise<CustomerOrderSummary[]> {
    return serverApiGet("/admin/customers", customerOrderSummaryListResponseSchema);
  },
};
