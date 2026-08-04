import type { NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import {
  ADMIN_CUSTOMER_SORTS,
  DEFAULT_ADMIN_CUSTOMER_SORT,
} from "@/src/domain/entities/AdminCustomerFilters";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { ExportCustomers } from "@/src/domain/use-cases/exports/ExportCustomers";
import { activityLog, orderRepository, userRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAdminCustomerFilters } from "@/src/lib/api/admin-customer-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream, type CsvValue } from "@/src/lib/csv";

// A snapshot of live customer data, per request.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/customers — the customers list as a streamed CSV. Admin
 * only. Same `q` / `sort` params as the screen; see the orders export for why the
 * response is a bare streamed body.
 *
 * This file carries personal data — names and phone numbers — which the other two
 * do not. It is admin-gated like every other admin endpoint, and it is worth being
 * clear-eyed that a CSV leaves that boundary the moment it lands in Downloads: an
 * export is a deliberate copy, and the audit trail records who asked for the pages
 * it was built from, not where the file went.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("dashboard.view");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminCustomerFilters(params);
  const { sort } = parsePageRequest(params, ADMIN_CUSTOMER_SORTS, {
    sort: DEFAULT_ADMIN_CUSTOMER_SORT,
  });

  const customers = new ExportCustomers(orderRepository, userRepository).execute(filters, sort);

  await activityLog.recordEvent({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.id,
    action: "export.downloaded",
    entityType: "export",
    entityId: "customers",
    entityLabel: "customers",
    changes: singleChange("query", null, filters.query ?? "all"),
  });

  return csvResponse(csvFilename("customers"), csvStream(HEADER, toRows(customers)));
}

/**
 * The columns. `rank` is the customer's position in the *full* spend ranking, so a
 * filtered export still says where each row sits overall — the same guarantee the
 * screen makes on page 2.
 */
const HEADER = [
  "rank",
  "user_id",
  "name",
  "phone",
  "order_count",
  "total_spent",
  "last_order_at",
] as const;

async function* toRows(customers: AsyncIterable<CustomerOrderSummary>): AsyncGenerator<CsvValue[]> {
  for await (const customer of customers) {
    yield [
      customer.rank,
      customer.userId,
      customer.name,
      // Quoted like every cell, so a leading `+` on an international number is
      // preserved as text instead of being read as a formula (see `csvCell`).
      customer.phone,
      customer.orderCount,
      customer.totalSpent,
      customer.lastOrderAt,
    ];
  }
}
