import { NextResponse, type NextRequest } from "next/server";

import { orderReturnDecisionSchema, orderReturnRequestSchema } from "@/src/contracts/order-return-schema";
import { RequestOrderReturn } from "@/src/domain/use-cases/orders/RequestOrderReturn";
import { ResolveOrderReturn } from "@/src/domain/use-cases/orders/ResolveOrderReturn";
import {
  orderRepository,
  unitOfWork,
  orderNotifier,
  returnRepository,
  userRepository,
  adminNotificationRepository,
  emailSender,
  notificationTemplateRepository,
} from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";
import { getSessionWith } from "@/src/lib/require-permission";

// Mutates order/stock/wallet state — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/:id/return — open a return request on a delivered order.
 *
 * The customer action. Auth required and scoped to the owner. Body carries the
 * reason and which lines (with quantities) are being returned — validated with
 * the same Zod schema the storefront's return form uses; never trust the
 * client. Moves the order to `return_requested` and records a `ReturnRequest`
 * (no money/stock moves yet) and returns the order. Maps an unknown/foreign id
 * to 404 and a non-returnable order (wrong status or past the window) to 400.
 * The admin decides via PUT.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderReturnRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Select at least one item to return.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const order = await new RequestOrderReturn(
      orderRepository,
      unitOfWork,
      userRepository,
      adminNotificationRepository,
      emailSender,
      notificationTemplateRepository,
    ).execute({
      userId: session.user.id,
      orderId: id,
      reason: parsed.data.reason,
      items: parsed.data.items,
    });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/orders/${id}/return failed`);
  }
}

/**
 * GET /api/orders/:id/return — the most recent return request on this order, or
 * `null`. Admin only (the dashboard's return-inspection panel is the only
 * caller): re-checked here rather than trusted from the order fetch, the same
 * permission `PUT` requires to resolve one.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const returnRequest = await returnRepository.getForOrder(id);
    return NextResponse.json(returnRequest);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/orders/${id}/return failed`);
  }
}

/**
 * PUT /api/orders/:id/return — resolve a pending return request. Admin only.
 *
 * Mirrors the tracking route's customer-GET/admin-PUT split. Validates the
 * decision with the same Zod schema the dashboard uses; `approve` refunds
 * (restock the inspected/restockable lines + wallet credit to the customer),
 * `reject` restores the order. Maps an unknown id to 404 and an order with no
 * pending request to 400.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
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
      unitOfWork,
      orderNotifier,
      returnRepository,
    ).execute(id, parsed.data.decision, {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
    });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/orders/${id}/return failed`);
  }
}
