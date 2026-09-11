import { NextResponse, type NextRequest } from "next/server";

import { addFundsSchema } from "@/src/contracts/wallet-schema";
import { AddFunds } from "@/src/domain/use-cases/wallet/AddFunds";
import { walletRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user mutation — never statically cached.
export const dynamic = "force-dynamic";

/**
 * POST /api/wallet/funds — add money to the signed-in user's wallet. Auth required.
 * Thin controller: authenticate → validate (same Zod schema the form uses) →
 * delegate to the use-case → map domain errors to HTTP. Returns 204 (the client
 * refreshes the server-rendered wallet rather than reading a body back).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = addFundsSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    await new AddFunds(walletRepository).execute(session.user.id, parsed.data.amount);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/wallet/funds failed");
  }
}
