import { NextResponse } from "next/server";
import { GetWallet } from "@/src/domain/use-cases/wallet/GetWallet";
import { walletRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/wallet — the signed-in user's wallet (balance + saved cards + recent
 * transactions). Auth required: the wallet is account data, so an anonymous caller
 * gets 401 (the account area sends them to login).
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const wallet = await new GetWallet(walletRepository).execute(session.user.id);
    return NextResponse.json(wallet);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/wallet failed");
  }
}
