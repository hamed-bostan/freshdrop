import { NextResponse, type NextRequest } from "next/server";

import { SetDefaultDeliveryLocation } from "@/src/domain/use-cases/delivery-locations/SetDefaultDeliveryLocation";
import { deliveryLocationRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user data, written per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/delivery-locations/:id/default — make this address the signed-in user's
 * checkout default.
 *
 * Thin controller: authenticate → delegate to the use-case, which scopes the write
 * to the caller (404 for an unknown/other id) and clears the previous default. No
 * body — the id in the path is the whole request; it's idempotent (re-selecting the
 * same address is a no-op that returns it). Returns the updated address.
 */
export async function PUT(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const location = await new SetDefaultDeliveryLocation(deliveryLocationRepository).execute(
      session.user.id,
      id,
    );
    return NextResponse.json(location);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/delivery-locations/${id}/default failed`);
  }
}
