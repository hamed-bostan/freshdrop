import type { GeoPoint, Place } from "@/src/domain/entities/Place";

/**
 * Browser-side wrappers around our own `/api/geocoding/*` route handlers (never
 * Nominatim directly). Both accept an `AbortSignal` so callers can cancel
 * in-flight requests when the query changes or the component unmounts.
 */

interface SearchResponse {
  places: Place[];
}

interface ReverseResponse {
  place: Place | null;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/geocoding/search?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Place search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchResponse;
  return data.places;
}

export async function reverseGeocode(point: GeoPoint, signal?: AbortSignal): Promise<Place | null> {
  const params = new URLSearchParams({
    lat: String(point.latitude),
    lon: String(point.longitude),
  });
  const response = await fetch(`/api/geocoding/reverse?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = (await response.json()) as ReverseResponse;
  return data.place;
}
