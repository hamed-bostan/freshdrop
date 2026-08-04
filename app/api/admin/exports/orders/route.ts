import type { NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { ADMIN_ORDER_SORTS, DEFAULT_ADMIN_ORDER_SORT } from "@/src/domain/entities/AdminOrderFilters";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid, orderRecognizedRevenue, orderRefundedTotal } from "@/src/domain/entities/Order";
import { ExportOrders } from "@/src/domain/use-cases/exports/ExportOrders";
import { activityLog, orderRepository, userRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream, type CsvValue } from "@/src/lib/csv";

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
    const orders = new ExportOrders(orderRepository, userRepository).execute(filters, sort);
    // Best-effort, after the download starts: recorded from the session's own actor,
    // never the request body, so the entry can't be told to blame someone else.
    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "orders",
      entityLabel: "orders",
      changes: singleChange("range", null, `${filters.placedFrom ?? "all"} .. ${filters.placedTo ?? "all"}`),
    });
    return csvResponse(csvFilename("orders"), csvStream(HEADER, toRows(orders)));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/orders failed");
  }
}

/**
 * The columns. Money is written three ways on purpose, because the three answer
 * different questions and an export that picks one forces whoever opens it to
 * guess: `total` is what was charged, `refunded` is what went back to the wallet,
 * and `revenue` is what the store actually kept — the same
 * `orderRecognizedRevenue` the analytics aggregates sum, so a spreadsheet total of
 * this column reconciles with the dashboard.
 */
const HEADER = [
  "id",
  "placed_at",
  "status",
  "stage",
  "customer_id",
  "items",
  "units",
  "subtotal",
  "shipping",
  "discount",
  "total",
  "refunded",
  "net_paid",
  "revenue",
  "delivery_window",
  "location",
] as const;

async function* toRows(orders: AsyncIterable<Order>): AsyncGenerator<CsvValue[]> {
  for await (const order of orders) {
    yield [
      order.id,
      // ISO 8601, not a locale format: an export is machine-read as often as it's
      // eyeballed, and "07/22/2026" is ambiguous the moment it crosses a border.
      order.placedAt,
      order.status,
      order.stage ?? "",
      order.userId,
      order.items.length,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.subtotal,
      order.shipping,
      order.discount,
      order.total,
      orderRefundedTotal(order.refunds),
      orderNetPaid(order, order.refunds),
      orderRecognizedRevenue(order, order.refunds),
      order.deliveryWindow ?? "",
      order.location,
    ];
  }
}
