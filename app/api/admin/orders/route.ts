import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ORDER_SORTS,
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
} from "@/src/domain/entities/AdminOrderFilters";
import { ListOrders } from "@/src/domain/use-cases/orders/ListOrders";
import { orderRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
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
 * The storefront's per-user list is the separate `GET /api/orders`; the overview's
 * whole-history read is `GET /api/admin/orders/all`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminOrderFilters(params);
  const page = parsePageRequest(params, ADMIN_ORDER_SORTS, {
    sort: DEFAULT_ADMIN_ORDER_SORT,
    direction: DEFAULT_ADMIN_ORDER_DIRECTION,
  });

  try {
    const result = await new ListOrders(orderRepository).execute(filters, page);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders failed");
  }
}
