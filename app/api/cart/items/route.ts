import { NextResponse, type NextRequest } from "next/server";

import { addToCartSchema } from "@/src/contracts/cart-schema";
import { AddToCart } from "@/src/domain/use-cases/cart/AddToCart";
import { cartRepository, productRepository } from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user data — never statically cached.
export const dynamic = "force-dynamic";

/**
 * POST /api/cart/items — add a product to the signed-in user's cart (accumulating
 * onto any existing line). Auth required: the cart is user data, so anonymous
 * callers get 401 (the UI sends them to login).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = addToCartSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    await new AddToCart(cartRepository, productRepository).execute({
      userId: session.user.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/cart/items failed");
  }
}
