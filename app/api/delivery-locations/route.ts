import { NextResponse } from "next/server";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { deliveryLocationRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/delivery-locations — list delivery locations. Public (shown on the
 * storefront home and reused on the address/checkout screens).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const locations = await new GetDeliveryLocations(deliveryLocationRepository).execute();
    return NextResponse.json(locations);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/delivery-locations failed");
  }
}
