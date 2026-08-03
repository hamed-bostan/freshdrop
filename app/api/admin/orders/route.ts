import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ORDER_SORTS,
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
} from "@/src/domain/entities/AdminOrderFilters";
import { ListOrders } from "@/src/domain/use-cases/orders/ListOrders";
import { orderRepository, userRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Reads a page of orders per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders — one page of the cross-user order list. Admin only;
 * powers the dashboard's order-tracking table.
 *
 * Query params: `page`, `pageSize`, `sort`, `dir` (paging) and `q`, `status`
 * (filters). Responds with `{ items, total, page, pageSize }`.
 *
 * The storefront's per-user list is the separate `GET /api/orders`. There is no
 * whole-history variant: the overview's KPIs, which were the only caller of one,
 * now read aggregates from `GET /api/admin/analytics`.
 *
 * Read-only by design. An order is something a customer places, through checkout,
 * where they see and agree to what they're charged; there is deliberately no POST
 * here letting an admin enter one on their behalf.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminOrderFilters(params);
    const page = parsePageRequest(params, ADMIN_ORDER_SORTS, {
      sort: DEFAULT_ADMIN_ORDER_SORT,
      direction: DEFAULT_ADMIN_ORDER_DIRECTION,
    });
    const result = await new ListOrders(orderRepository, userRepository).execute(filters, page);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders failed");
  }
}
