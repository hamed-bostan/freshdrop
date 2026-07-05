import { NextResponse, type NextRequest } from "next/server";
import type { Cart } from "@/src/domain/entities/Cart";
import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { ClearCart } from "@/src/domain/use-cases/cart/ClearCart";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import { cartRepository, promoCodeRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// The cart (and any applied discount) is per-user, read per request — never cached.
export const dynamic = "force-dynamic";

/** A signed-out visitor has no cart yet; the public cart page renders this as empty. */
const EMPTY_CART: Cart = { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0 };

/**
 * GET /api/cart — the signed-in user's cart with server-computed totals.
 *
 * The cart page is public, so an anonymous caller isn't an error — they just have
 * no cart yet and get an empty one. An optional `?promo=<code>` is resolved
 * server-side so the discount and total are authoritative; an unknown code is
 * ignored (no discount), mirroring how the cart screen treats an unresolved promo.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return NextResponse.json(EMPTY_CART);

  try {
    const code = request.nextUrl.searchParams.get("promo");
    const promo = code ? await new FindPromoCode(promoCodeRepository).execute(code) : null;
    const cart = await new GetCart(cartRepository).execute({ userId: session.user.id, promo });
    return NextResponse.json(cart);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/cart failed");
  }
}

/**
 * DELETE /api/cart — empty the signed-in user's cart in one call. Auth required:
 * the cart is user data, so anonymous callers get 401 (the UI sends them to login).
 */
export async function DELETE(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    await new ClearCart(cartRepository).execute(session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, "DELETE /api/cart failed");
  }
}
