import { NextResponse, type NextRequest } from "next/server";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { CreateDeliveryLocation } from "@/src/domain/use-cases/delivery-locations/CreateDeliveryLocation";
import { deliveryLocationRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import {
  deliveryLocationSchema,
  DELIVERY_LOCATION_LABELS,
} from "@/src/contracts/delivery-location-schema";
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
 * GET /api/delivery-locations — the signed-in user's saved addresses.
 *
 * Auth required: addresses are user data, so anonymous callers get 401. The server
 * read service swallows that 401 into an empty list, so the public home page still
 * renders (it just shows no saved addresses).
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  try {
    const locations = await new GetDeliveryLocations(deliveryLocationRepository).execute(session.user.id);
    return NextResponse.json(locations);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/delivery-locations failed");
  }
}

/**
 * POST /api/delivery-locations — save a new address for the signed-in user.
 *
 * Thin controller: authenticate → validate → derive the display label from the
 * kind → delegate to the use-case (which scopes the row to the caller).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = deliveryLocationSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const location = await new CreateDeliveryLocation(deliveryLocationRepository).execute(session.user.id, {
      label: DELIVERY_LOCATION_LABELS[parsed.data.kind],
      address: parsed.data.address,
      city: parsed.data.city,
      kind: parsed.data.kind,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/delivery-locations failed");
  }
}
