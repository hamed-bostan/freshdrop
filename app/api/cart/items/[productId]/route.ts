import { NextResponse, type NextRequest } from "next/server";
import { UpdateCartItemQuantity } from "@/src/domain/use-cases/cart/UpdateCartItemQuantity";
import { RemoveFromCart } from "@/src/domain/use-cases/cart/RemoveFromCart";
import { cartRepository, productRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { updateCartItemSchema } from "@/src/contracts/cart-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Per-user data — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ productId: string }> };

/**
 * PATCH /api/cart/items/:productId — set a cart line to an absolute quantity.
 * Auth required.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const { productId } = await params;

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = updateCartItemSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    await new UpdateCartItemQuantity(cartRepository, productRepository).execute({
      userId: session.user.id,
      productId,
      quantity: parsed.data.quantity,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/cart/items/${productId} failed`);
  }
}

/** DELETE /api/cart/items/:productId — remove a line from the cart. Auth required. */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const { productId } = await params;

  try {
    await new RemoveFromCart(cartRepository).execute(session.user.id, productId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/cart/items/${productId} failed`);
  }
}
