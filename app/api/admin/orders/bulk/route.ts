import { NextResponse, type NextRequest } from "next/server";

import { orderBulkRequestSchema, type OrderBulkAction } from "@/src/contracts/bulk-action-schema";
import {
  BulkUpdateOrders,
  type OrderBulkChange,
} from "@/src/domain/use-cases/orders/BulkUpdateOrders";
import { orderNotifier, orderRepository, unitOfWork } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/orders/bulk — apply one action to a selection of orders
 * (advance the delivery stage, or cancel).
 *
 * Thin controller, like the products bulk route: authenticate → validate with the
 * same Zod schema the selection UI uses → translate the wire action into the
 * domain's change → delegate. Answers `{ updated }`, the number of orders the
 * action actually moved, which the screen reports rather than assuming the whole
 * selection took it.
 *
 * Gated on `orders.fulfill`, the permission the single-order stage and return
 * controls already require: moving an order along and calling one off both move
 * money, which is why they aren't part of plain viewing. Doing it to twenty at
 * once doesn't make it a different job, so it isn't a different permission.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderBulkRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    // The actor comes from the session, never from the body — otherwise the
    // activity entries this writes would record whoever the client claimed to be.
    const updated = await new BulkUpdateOrders(orderRepository, unitOfWork, orderNotifier).execute(
      parsed.data.ids,
      toChange(parsed.data.action),
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    return NextResponse.json({ updated: updated.length });
  } catch (error) {
    return errorResponseFromException(error, "PATCH /api/admin/orders/bulk failed");
  }
}

/** The wire action as the domain states it. Near-identical here, unlike products — the verbs match the writes. */
function toChange(action: OrderBulkAction): OrderBulkChange {
  return action.type === "cancel" ? { type: "cancel" } : { type: "setStage", stage: action.stage };
}
