import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { ADMIN_ORDER_SORTS, DEFAULT_ADMIN_ORDER_SORT } from "@/src/domain/entities/AdminOrderFilters";
import { buildOrdersDataset } from "@/src/domain/use-cases/exports/datasets/OrdersDataset";
import { activityLog, orderRepository, userRepository } from "@/src/infrastructure/container";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream } from "@/src/lib/csv";
import { getSessionWith } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

// A snapshot of live order data, per request.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/orders — the orders list as a streamed CSV. Admin only.
 *
 * Takes the same query params the orders screen puts in the URL (`q`, `status`,
 * `sort`), parsed by the same functions, so the file is exactly the rows on
 * screen. `page`/`pageSize` are ignored: an export is the whole filtered set, which
 * is the one thing the screen can't give you.
 *
 * The columns live in `buildOrdersDataset` (shared with the async job pipeline
 * behind the custom export builder), not here — see the orders export routine
 * for why this file, not the route, owns them.
 *
 * Streamed rather than assembled — see `csvStream`. That is also why this returns a
 * bare `Response` and not the JSON envelope every other endpoint uses: the body is
 * a file, and by the time a query could fail the 200 and the header row are already
 * on the wire. Failures after that abort the stream (a failed download) rather than
 * silently truncating a file an admin would otherwise trust.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("dashboard.view");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminOrderFilters(params);
    const { sort } = parsePageRequest(params, ADMIN_ORDER_SORTS, { sort: DEFAULT_ADMIN_ORDER_SORT });
    const period = `${filters.placedFrom ?? "all"} .. ${filters.placedTo ?? "all"}`;
    const dataset = buildOrdersDataset({ orders: orderRepository, users: userRepository }, filters, sort, period);
    const [section] = dataset.sections;
    // Best-effort, after the download starts: recorded from the session's own actor,
    // never the request body, so the entry can't be told to blame someone else.
    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "orders",
      entityLabel: "orders",
      changes: singleChange("range", null, period),
    });
    return csvResponse(csvFilename("orders"), csvStream(section.header, section.rows));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/orders failed");
  }
}
