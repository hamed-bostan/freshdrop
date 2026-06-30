import { NextResponse, type NextRequest } from "next/server";
import { GetPromoCodes } from "@/src/domain/use-cases/promo-codes/GetPromoCodes";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import { promoCodeRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/promo-codes — promo codes the user can browse and apply. Public.
 *
 * `?code=<code>` resolves a single code (case-insensitive) and returns it in a
 * one- or zero-element array — the same filter-the-list shape as
 * `GET /api/categories?slug=`, so the server service can take `[0]`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const promo = await new FindPromoCode(promoCodeRepository).execute(code);
      return NextResponse.json(promo ? [promo] : []);
    }

    const promos = await new GetPromoCodes(promoCodeRepository).execute();
    return NextResponse.json(promos);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/promo-codes failed");
  }
}
