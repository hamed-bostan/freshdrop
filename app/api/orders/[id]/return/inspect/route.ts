import { NextResponse, type NextRequest } from "next/server";

import { orderReturnInspectionSchema } from "@/src/contracts/order-return-schema";
import { RecordReturnInspection } from "@/src/domain/use-cases/orders/RecordReturnInspection";
import { orderRepository, returnRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// Writes return/order state — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/:id/return/inspect — record each returned item's condition
 * and recovery decision on the order's pending return request. Admin only,
 * same permission as resolving the return. Validated with the same Zod schema
 * the dashboard's inspection form uses; never trust the client. Optional step —
 * `ResolveOrderReturn.approve` doesn't require it, it just restocks nothing for
 * an item that skipped inspection.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderReturnInspectionSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Record at least one item's inspection.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const returnRequest = await new RecordReturnInspection(orderRepository, returnRepository).execute({
      orderId: id,
      items: parsed.data.items,
      actor: { id: session.user.id, name: session.user.name ?? session.user.id },
    });
    return NextResponse.json(returnRequest);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/orders/${id}/return/inspect failed`);
  }
}
