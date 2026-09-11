import { NextResponse, type NextRequest } from "next/server";

import { GetOrderMessageDefault } from "@/src/domain/use-cases/orders/GetOrderMessageDefault";
import { orderRepository, notificationTemplateRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// The template row can change at any time — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/orders/:id/message-default — the ad hoc customer-message
 * form's starting subject/body for this order (phase 4). Gated by
 * `orders.notify`, the same permission that gates sending the message —
 * whoever may send it may see what it'd start as.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("orders.notify");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const message = await new GetOrderMessageDefault(orderRepository, notificationTemplateRepository).execute(id);
    return NextResponse.json(message);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/orders/${id}/message-default failed`);
  }
}
