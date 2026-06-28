/** A point on the Earth, in decimal degrees (WGS 84). */
export type GeoPoint = {
  latitude: number;
  longitude: number;
}

/**
 * A geocoded place: the result of searching for an address or reverse-geocoding
 * a coordinate. Kept provider-agnostic on purpose — Nominatim, Mapbox, Google,
 * etc. all map onto this shape so nothing above the repository layer cares which
 * provider produced it.
 */
export type Place = {
  /** Stable provider id for the result. */
  id: string;
  /** Short, human label for the result (e.g. "Queen's Park"). */
  name: string;
  /** Full, formatted address line. */
  address: string;
  /** Settlement the place belongs to (city / town / village), when known. */
  city?: string;
  point: GeoPoint;
}

/** Guards a coordinate against the valid latitude/longitude ranges. */
export const isValidGeoPoint = ({ latitude, longitude }: GeoPoint): boolean =>
  Number.isFinite(latitude) &&
  Math.abs(latitude) <= 90 &&
  Number.isFinite(longitude) &&
  Math.abs(longitude) <= 180;
