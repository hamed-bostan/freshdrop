import { NextResponse, type NextRequest } from "next/server";
import { CancelOrder } from "@/src/domain/use-cases/orders/CancelOrder";
import { orderRepository, productRepository, walletRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Mutates order/stock/wallet state — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/:id/cancel — cancel a live, pre-dispatch order.
 *
 * Auth required and scoped to the owner. The use-case restocks the items and
 * refunds the total to the wallet, then returns the updated order. Maps an
 * unknown/foreign id to 404 and a non-cancellable order to 400.
 */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const order = await new CancelOrder(orderRepository, productRepository, walletRepository).execute({
      userId: session.user.id,
      orderId: id,
    });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/orders/${id}/cancel failed`);
  }
}
