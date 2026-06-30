import { NextResponse } from "next/server";
import { GetPaymentMethods } from "@/src/domain/use-cases/payment-methods/GetPaymentMethods";
import { paymentMethodRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Read from Postgres per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/payment-methods — the payment-option catalog (Cash, Wallet, PayPal, …).
 * Public reference data, like categories: the checkout and payment screens read it.
 * The caller's own saved cards are a separate, per-user read (`/api/wallet/cards`).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const methods = await new GetPaymentMethods(paymentMethodRepository).execute();
    return NextResponse.json(methods);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/payment-methods failed");
  }
}
