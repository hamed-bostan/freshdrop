import { NextResponse } from "next/server";

import { GetOrderById } from "@/src/domain/use-cases/orders/GetOrderById";
import { orderRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// Reads one order per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/orders/:id — a single order, across users. Admin only; powers the
 * dashboard's order-detail route. 404 when no order matches so the page can
 * `notFound()`. The storefront's owner-scoped read is the separate `GET /api/orders`.
 */
export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const { id } = await params;
  try {
    const order = await new GetOrderById(orderRepository).execute(id);
    if (!order) return errorResponse(404, { message: "That order no longer exists.", code: "NOT_FOUND" });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/orders/${id} failed`);
  }
}
