import { NextResponse, type NextRequest } from "next/server";
import { ReorderItems } from "@/src/domain/use-cases/orders/ReorderItems";
import { orderRepository, cartRepository, productRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Mutates the caller's cart — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/:id/reorder — add a past order's items back to the cart.
 *
 * Auth required and scoped to the order's owner (the use-case 404s a mismatch).
 * Returns the added/skipped counts so the client can tell the user if any items
 * are no longer available. No body: the order id is the whole request.
 */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const result = await new ReorderItems(orderRepository, cartRepository, productRepository).execute({
      userId: session.user.id,
      orderId: id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/orders/${id}/reorder failed`);
  }
}
