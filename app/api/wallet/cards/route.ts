import { NextResponse, type NextRequest } from "next/server";
import { AddCard } from "@/src/domain/use-cases/wallet/AddCard";
import { ListWalletCards } from "@/src/domain/use-cases/wallet/ListWalletCards";
import { walletRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { addCardSchema } from "@/src/contracts/wallet-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Per-user data — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/wallet/cards — the signed-in user's saved cards (for the payment-methods
 * screen's "Credit Card" section). Auth required.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const cards = await new ListWalletCards(walletRepository).execute(session.user.id);
    return NextResponse.json(cards);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/wallet/cards failed");
  }
}

/**
 * POST /api/wallet/cards — save a new card for the signed-in user. Auth required.
 * The use-case derives the brand, masks the PAN to a last-4 display number, and
 * never persists the CVV. Returns the created card (201).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = addCardSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const card = await new AddCard(walletRepository).execute(session.user.id, {
      number: parsed.data.number,
      holderName: parsed.data.holderName,
      expiryMonth: parsed.data.expiryMonth,
      expiryYear: parsed.data.expiryYear,
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/wallet/cards failed");
  }
}
