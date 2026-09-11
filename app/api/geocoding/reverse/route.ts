import { NextResponse, type NextRequest } from "next/server";

import { isValidGeoPoint } from "@/src/domain/entities/Place";
import { ReverseGeocode } from "@/src/domain/use-cases/geocoding/ReverseGeocode";
import { parseLocale } from "@/src/i18n/parseLocale";
import { geocodingRepository } from "@/src/infrastructure/container";

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
    // Message only: the upstream is unreachable often enough that a stack per
    // failed map drag would bury everything else in the log.
    console.error("Reverse geocoding failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Reverse geocoding failed." }, { status: 502 });
  }
}
