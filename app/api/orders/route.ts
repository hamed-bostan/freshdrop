import { NextResponse, type NextRequest } from "next/server";
import { GetOrders } from "@/src/domain/use-cases/orders/GetOrders";
import { CreateOrder } from "@/src/domain/use-cases/orders/CreateOrder";
import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import {
  orderRepository,
  cartRepository,
  deliveryLocationRepository,
  promoCodeRepository,
} from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { placeOrderSchema } from "@/src/presentation/checkout/checkout-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/orders — the signed-in user's orders, newest first.
 *
 * Auth required: orders are user data, so anonymous callers get 401. The list is
 * scoped to the caller — the admin dashboard's cross-user view is a separate
 * endpoint (`GET /api/admin/orders`).
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  try {
    const orders = await new GetOrders(orderRepository).execute(session.user.id);
    return NextResponse.json(orders);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/orders failed");
  }
}

/**
 * POST /api/orders — place an order from the signed-in user's cart.
 *
 * Thin controller: authenticate → validate selections → resolve the address and
 * recompute the cart server-side (totals are never trusted from the client) →
 * delegate to the use-case, which snapshots the cart into the order and clears it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = placeOrderSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const locations = await new GetDeliveryLocations(deliveryLocationRepository).execute(session.user.id);
    const address = locations.find((location) => location.id === parsed.data.addressId);
    if (!address) {
      return errorResponse(400, {
        message: "That delivery address no longer exists.",
        code: "VALIDATION",
        fieldErrors: { addressId: "Select a delivery address." },
      });
    }

    // Recompute the cart (with any applied promo) so the recorded total is the
    // server's, matching what the user saw at checkout.
    const promo = parsed.data.promo
      ? await new FindPromoCode(promoCodeRepository).execute(parsed.data.promo)
      : null;
    const cart = await new GetCart(cartRepository).execute({ userId: session.user.id, promo });

    const order = await new CreateOrder(orderRepository, cartRepository).execute({
      userId: session.user.id,
      location: address.address,
      cart,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/orders failed");
  }
}
