import { NextResponse, type NextRequest } from "next/server";
import { RequestOrderReturn } from "@/src/domain/use-cases/orders/RequestOrderReturn";
import { ResolveOrderReturn } from "@/src/domain/use-cases/orders/ResolveOrderReturn";
import { orderRepository, productRepository, walletRepository, orderNotifier } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { getUserSession } from "@/src/lib/require-auth";
import { orderReturnDecisionSchema } from "@/src/presentation/dashboard/orders/order-return-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Mutates order/stock/wallet state — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/:id/return — open a return request on a delivered order.
 *
 * The customer action. Auth required and scoped to the owner. Moves the order to
 * `return_requested` (no money/stock moves yet) and returns it. Maps an
 * unknown/foreign id to 404 and a non-returnable order (wrong status or past the
 * window) to 400. The admin decides via PUT.
 */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const order = await new RequestOrderReturn(orderRepository).execute({
      userId: session.user.id,
      orderId: id,
    });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/orders/${id}/return failed`);
  }
}

/**
 * PUT /api/orders/:id/return — resolve a pending return request. Admin only.
 *
 * Mirrors the tracking route's customer-GET/admin-PUT split. Validates the
 * decision with the same Zod schema the dashboard uses; `approve` refunds
 * (restock + wallet credit to the customer), `reject` restores the order. Maps
 * an unknown id to 404 and an order with no pending request to 400.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderReturnDecisionSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please pick a valid decision.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const order = await new ResolveOrderReturn(
      orderRepository,
      productRepository,
      walletRepository,
      orderNotifier,
    ).execute(id, parsed.data.decision);
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/orders/${id}/return failed`);
  }
}
