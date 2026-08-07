import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { ADMIN_CUSTOMER_SORTS, DEFAULT_ADMIN_CUSTOMER_SORT } from "@/src/domain/entities/AdminCustomerFilters";
import { buildCustomersDataset } from "@/src/domain/use-cases/exports/datasets/CustomersDataset";
import { activityLog, orderRepository, userRepository } from "@/src/infrastructure/container";
import { parseAdminCustomerFilters } from "@/src/lib/api/admin-customer-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream } from "@/src/lib/csv";
import { getSessionWith } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

// A snapshot of live customer data, per request.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/customers — the customers list as a streamed CSV. Admin
 * only. Same `q` / `sort` params as the screen; see the orders export for why the
 * response is a bare streamed body. The columns live in `buildCustomersDataset`,
 * shared with the job pipeline behind the custom export builder.
 *
 * There is no date-range filter, on purpose, not by oversight: `ExportCustomers`
 * ranks customers by *all-time* spend (see its own docstring), so a `rank` scoped
 * to a window would answer a different question than the one this file's name
 * promises. The Export center's quick-export card and custom builder both omit the
 * date picker for this report rather than sending a `from`/`to` this route would
 * have to ignore — see `export-report-catalog.ts`'s `periodCapable`.
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

  try {
    const filters = parseAdminCustomerFilters(params);
    const { sort } = parsePageRequest(params, ADMIN_CUSTOMER_SORTS, { sort: DEFAULT_ADMIN_CUSTOMER_SORT });
    const dataset = buildCustomersDataset({ orders: orderRepository, users: userRepository }, filters, sort);
    const [section] = dataset.sections;

    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "customers",
      entityLabel: "customers",
      changes: singleChange("query", null, filters.query ?? "all"),
    });

    return csvResponse(csvFilename("customers"), csvStream(section.header, section.rows));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/customers failed");
  }
}
