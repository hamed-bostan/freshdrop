import { NextResponse, type NextRequest } from "next/server";
import { IssueRefund } from "@/src/domain/use-cases/refunds/IssueRefund";
import { orderRepository, unitOfWork } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { issueRefundSchema } from "@/src/contracts/refund-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Mutates order/wallet state — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/orders/:id/refunds — issue a discretionary line-item or
 * bare-amount refund (phase 7). Requires `refunds.issue` (admin/owner only —
 * narrower than the `orders.fulfill` return approval, since this endpoint is
 * where an operator picks the amount rather than approving a fixed, guarded
 * transition). Validates with the same Zod schema the dashboard control uses;
 * an amount over what's left to refund on the order maps to 400.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("refunds.issue");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = issueRefundSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  const target =
    parsed.data.lines != null
      ? { kind: "lines" as const, lines: parsed.data.lines }
      : { kind: "amount" as const, amount: parsed.data.amount! };

  try {
    const order = await new IssueRefund(orderRepository, unitOfWork).execute({
      orderId: id,
      reason: parsed.data.reason,
      // The actor comes from the session, never from the body.
      actor: { id: session.user.id, name: session.user.name ?? session.user.id },
      target,
    });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/admin/orders/${id}/refunds failed`);
  }
}
