import { NextResponse, type NextRequest } from "next/server";
import { ResolveItemSubstitution } from "@/src/domain/use-cases/orders/ResolveItemSubstitution";
import {
  orderRepository,
  productRepository,
  walletRepository,
  orderNotifier,
} from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { orderSubstitutionSchema } from "@/src/presentation/dashboard/orders/order-substitution-schema";
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
 * POST /api/admin/orders/:id/substitutions — resolve an out-of-stock line while
 * picking. Admin only (the picker action). Validates with the same Zod schema the
 * dashboard control uses; `substitute` swaps the line for the chosen replacement
 * (claiming its stock and refunding any saving), `refund` drops and refunds it.
 * Maps an unknown order/line to 404, a not-being-picked order or non-approved
 * substitution to 400, and a replacement that's also out of stock to 409.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderSubstitutionSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  const resolution =
    parsed.data.action === "substitute"
      ? { action: "substitute" as const, replacementProductId: parsed.data.replacementProductId }
      : { action: "refund" as const };

  try {
    const order = await new ResolveItemSubstitution(
      orderRepository,
      productRepository,
      walletRepository,
      orderNotifier,
    ).execute({ orderId: id, productId: parsed.data.productId, resolution });
    return NextResponse.json(order);
  } catch (error) {
    return errorResponseFromException(error, `POST /api/admin/orders/${id}/substitutions failed`);
  }
}
