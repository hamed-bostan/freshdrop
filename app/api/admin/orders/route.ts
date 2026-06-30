import { NextResponse } from "next/server";
import { GetAllOrders } from "@/src/domain/use-cases/orders/GetAllOrders";
import { orderRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Reads every order per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders — every order across users, newest first. Admin only;
 * powers the dashboard's order-tracking table. The storefront's per-user list is
 * the separate `GET /api/orders`.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  try {
    const orders = await new GetAllOrders(orderRepository).execute();
    return NextResponse.json(orders);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders failed");
  }
}
