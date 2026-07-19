import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_CUSTOMER_SORTS,
  DEFAULT_ADMIN_CUSTOMER_DIRECTION,
  DEFAULT_ADMIN_CUSTOMER_SORT,
} from "@/src/domain/entities/AdminCustomerFilters";
import { ListCustomerSummaries } from "@/src/domain/use-cases/orders/ListCustomerSummaries";
import { orderRepository, userRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { parseAdminCustomerFilters } from "@/src/lib/api/admin-customer-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Aggregates the order history per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/customers — one page of the customers list: everyone who has
 * ordered, ranked by total spend (highest first). Admin only.
 *
 * Query params: `page`, `pageSize`, `sort`, `dir` (paging) and `q`, `ids`
 * (filters). Responds with `{ items, total, page, pageSize }`.
 *
 * Three callers, one endpoint: the customers page takes it a page at a time, the
 * overview's "top customers" panel asks for the first few by spend, and the orders
 * table passes `ids` to label a page of orders with who placed them.
 *
 * Each customer's `rank` is their position in the *full* spend ranking, fixed
 * before paging or filtering, so it stays meaningful on page 2 and in a search.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminCustomerFilters(params);
  const page = parsePageRequest(params, ADMIN_CUSTOMER_SORTS, {
    sort: DEFAULT_ADMIN_CUSTOMER_SORT,
    direction: DEFAULT_ADMIN_CUSTOMER_DIRECTION,
  });

  try {
    const result = await new ListCustomerSummaries(orderRepository, userRepository).execute(filters, page);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/customers failed");
  }
}
