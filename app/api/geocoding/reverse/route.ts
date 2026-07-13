import { NextResponse, type NextRequest } from "next/server";
import { isValidGeoPoint } from "@/src/domain/entities/Place";
import { ReverseGeocode } from "@/src/domain/use-cases/geocoding/ReverseGeocode";
import { geocodingRepository } from "@/src/infrastructure/container";
import { parseLocale } from "@/src/i18n/parseLocale";

/**
 * Reverse geocoding endpoint: `GET /api/geocoding/reverse?lat=...&lon=...`.
 *
 * Used by the map to resolve the dragged-to coordinate into a human address.
 */
export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lon"));

  if (!isValidGeoPoint({ latitude, longitude })) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  try {
    const place = await new ReverseGeocode(geocodingRepository).execute(
      { latitude, longitude },
      { language: parseLocale(request.nextUrl.searchParams.get("lang")) },
    );
    return NextResponse.json({ place });
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return NextResponse.json({ error: "Reverse geocoding failed." }, { status: 502 });
  }
}
