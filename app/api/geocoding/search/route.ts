import { NextResponse, type NextRequest } from "next/server";
import { SearchPlaces } from "@/src/domain/use-cases/geocoding/SearchPlaces";
import { geocodingRepository } from "@/src/infrastructure/container";

const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 5;

/**
 * Forward geocoding endpoint: `GET /api/geocoding/search?q=...&limit=...`.
 *
 * The client map calls this instead of Nominatim directly — the actual upstream
 * request happens here, server-side (see `NominatimGeocodingRepository`).
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ places: [] });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const places = await new SearchPlaces(geocodingRepository).execute(query, { limit });
    return NextResponse.json({ places });
  } catch (error) {
    console.error("Geocoding search failed:", error);
    return NextResponse.json({ error: "Geocoding search failed." }, { status: 502 });
  }
}
