import { NextResponse, type NextRequest } from "next/server";
import { GetDeliveryLocation } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocation";
import { UpdateDeliveryLocation } from "@/src/domain/use-cases/delivery-locations/UpdateDeliveryLocation";
import { DeleteDeliveryLocation } from "@/src/domain/use-cases/delivery-locations/DeleteDeliveryLocation";
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

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/delivery-locations/:id — one of the signed-in user's saved addresses.
 *
 * Auth required (addresses are user data). The lookup is scoped to the caller, so
 * another user's id resolves to 404 rather than leaking that the row exists.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const location = await new GetDeliveryLocation(deliveryLocationRepository).execute(session.user.id, id);
    if (!location) return errorResponse(404, { message: "Address not found.", code: "NOT_FOUND" });
    return NextResponse.json(location);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/delivery-locations/${id} failed`);
  }
}

/**
 * PUT /api/delivery-locations/:id — edit an existing address for the signed-in user.
 *
 * Thin controller mirroring POST: authenticate → validate (same Zod schema the
 * client uses) → derive the display label from the kind → delegate to the
 * use-case, which scopes the write to the caller (404 for an unknown/other id).
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
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
    const location = await new UpdateDeliveryLocation(deliveryLocationRepository).execute(session.user.id, id, {
      label: DELIVERY_LOCATION_LABELS[parsed.data.kind],
      address: parsed.data.address,
      city: parsed.data.city,
      kind: parsed.data.kind,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });
    return NextResponse.json(location);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/delivery-locations/${id} failed`);
  }
}

/**
 * DELETE /api/delivery-locations/:id — remove one of the signed-in user's addresses.
 *
 * Auth required (addresses are user data). The delete is scoped to the caller, so an
 * unknown (or someone else's) id resolves to 404 rather than touching another user's
 * row. 204 on success.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new DeleteDeliveryLocation(deliveryLocationRepository).execute(session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/delivery-locations/${id} failed`);
  }
}
