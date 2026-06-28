import type { GeoPoint, Place } from "../entities/Place";

export type GeocodingSearchOptions = {
  /** Maximum number of results to return. */
  limit?: number;
  /** ISO 3166-1 alpha-2 codes (e.g. `["ca"]`) to bias/restrict results to. */
  countryCodes?: string[];
}

/**
 * Boundary between the app and whatever maps/geocoding provider is in use.
 * Implementations live in `infrastructure` and are bound in the container, so
 * swapping Nominatim for Mapbox/Google never touches the domain or UI.
 */
export type IGeocodingRepository = {
  /** Forward geocoding: free-text query → ranked places. */
  search(query: string, options?: GeocodingSearchOptions): Promise<Place[]>;
  /** Reverse geocoding: a coordinate → the place at it (or `null` if none). */
  reverse(point: GeoPoint): Promise<Place | null>;
}
