import { NextResponse } from "next/server";
import { GetAllOrders } from "@/src/domain/use-cases/orders/GetAllOrders";
import { orderRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Reads every order per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/all — every order across users, newest first. Admin only.
 *
 * Exists for one caller: the dashboard overview, whose KPIs (30-day revenue,
 * orders in progress) are aggregates over the whole history and would be silently
 * *wrong* if computed from a single page. It deliberately isn't a `?all=true`
 * mode on the paged list — one URL answering with two different shapes is a trap
 * for anyone reading the response schema.
 *
 * It is also the last whole-table read in the dashboard, and a temporary one:
 * these aggregates belong in SQL, behind an analytics repository, rather than in
 * a component reducing every order in memory. Until that lands, this endpoint is
 * the honest name for what the overview is doing. Don't add callers.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  try {
    const orders = await new GetAllOrders(orderRepository).execute();
    return NextResponse.json(orders);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders/all failed");
  }
}
