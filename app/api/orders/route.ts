import { NextResponse, type NextRequest } from "next/server";

import { placeOrderSchema } from "@/src/contracts/checkout-schema";
import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { CreateOrder } from "@/src/domain/use-cases/orders/CreateOrder";
import { GetOrders } from "@/src/domain/use-cases/orders/GetOrders";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import {
  orderRepository,
  unitOfWork,
  cartRepository,
  productRepository,
  deliveryLocationRepository,
  deliverySlotRepository,
  promoCodeRepository,
  orderNotifier,
  userRepository,
  adminNotificationRepository,
  emailSender,
  taxSettingsRepository,
  notificationTemplateRepository,
} from "@/src/infrastructure/container";
import { getRequestLocale } from "@/src/lib/api/request-locale";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/orders — the signed-in user's orders, newest first.
 *
 * Auth required: orders are user data, so anonymous callers get 401. The list is
 * scoped to the caller — the admin dashboard's cross-user view is a separate
 * endpoint (`GET /api/admin/orders`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  try {
    const orders = await new GetOrders(orderRepository, productRepository).execute(
      session.user.id,
      getRequestLocale(request),
    );
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
        code: "ADDRESS_GONE",
        fieldErrors: { addressId: "Select a delivery address." },
      });
    }

    // Recompute the cart (with any applied promo) so the recorded total is the
    // server's, matching what the user saw at checkout.
    const promo = parsed.data.promo
      ? await new FindPromoCode(promoCodeRepository).execute(parsed.data.promo)
      : null;
    const taxSettings = await taxSettingsRepository.get();
    const cart = await new GetCart(cartRepository).execute({
      userId: session.user.id,
      promo,
      // Snapshot the order in the locale the shopper is checking out in — matches
      // what they saw, and is the fallback the order-history re-resolve falls back to.
      locale: getRequestLocale(request),
      taxRatePercent: taxSettings.enabled ? taxSettings.ratePercent : null,
    });

    // Collapse the per-line substitution choices into a productId→preference map
    // for the use-case; unlisted lines default to "substitute" there.
    const substitutionPreferences = parsed.data.substitutions
      ? Object.fromEntries(parsed.data.substitutions.map((s) => [s.productId, s.preference]))
      : undefined;

    const order = await new CreateOrder(
      unitOfWork,
      cartRepository,
      deliverySlotRepository,
      orderNotifier,
      promoCodeRepository,
      userRepository,
      adminNotificationRepository,
      emailSender,
      notificationTemplateRepository,
    ).execute({
      userId: session.user.id,
      location: address.address,
      locationLabel: address.label,
      // Snapshot the coordinate so tracking maps the order to its real destination.
      // Addresses saved without one (typed, not picked on the map) have none.
      destination:
        address.latitude != null && address.longitude != null
          ? { latitude: address.latitude, longitude: address.longitude }
          : undefined,
      city: address.city ?? undefined,
      cart,
      // The code the totals above were computed from, so the redemption is counted
      // against the campaign the shopper actually checked out under.
      promo: promo ?? undefined,
      deliveryDate: parsed.data.deliveryDate,
      deliveryWindowId: parsed.data.deliveryWindowId,
      substitutionPreferences,
      deliveryInstructions: parsed.data.deliveryInstructions,
      walletApplied: parsed.data.walletApplied,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/orders failed");
  }
}
