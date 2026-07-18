import { NextResponse, type NextRequest } from "next/server";
import { GetSelectedPaymentMethod } from "@/src/domain/use-cases/payment-methods/GetSelectedPaymentMethod";
import { SetSelectedPaymentMethod } from "@/src/domain/use-cases/payment-methods/SetSelectedPaymentMethod";
import { paymentMethodRepository, userRepository, walletRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { selectPaymentMethodSchema } from "@/src/contracts/payment-method-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Per-user preference, read/written per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/payment-methods/selected — the id of the payment method the signed-in
 * user last selected for checkout, as `{ selectedId }` (`null` when unset). Per-user
 * data, so auth is required — distinct from the public catalog at `/api/payment-methods`.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const selectedId = await new GetSelectedPaymentMethod(userRepository).execute(session.user.id);
    return NextResponse.json({ selectedId });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/payment-methods/selected failed");
  }
}

/**
 * PUT /api/payment-methods/selected — set the signed-in user's selected checkout
 * payment method. Body: `{ methodId }`. The use-case re-validates the id against the
 * catalog and the caller's own saved cards (never trusting the client), so an
 * unknown/forged id is a 400. Idempotent; returns `{ selectedId }`.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = selectPaymentMethodSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please choose a valid payment method.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    await new SetSelectedPaymentMethod(userRepository, paymentMethodRepository, walletRepository).execute(
      session.user.id,
      parsed.data.methodId,
    );
    return NextResponse.json({ selectedId: parsed.data.methodId });
  } catch (error) {
    return errorResponseFromException(error, "PUT /api/payment-methods/selected failed");
  }
}
