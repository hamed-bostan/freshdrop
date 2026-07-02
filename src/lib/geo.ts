import type { GeoPoint } from "@/src/domain/entities/Place";

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle (haversine) distance between two coordinates, in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a polyline route, in kilometres (0 for a single vertex). */
export function routeLengthKm(route: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i += 1) total += haversineKm(route[i - 1], route[i]);
  return total;
}

function lerp(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/**
 * The point `fraction` (0–1) of the way along `route`, measured by distance:
 * `0` is the first vertex, `1` the last. Values outside the range are clamped.
 * Used to place a courier along its road path from an elapsed-time fraction.
 */
export function pointAtFraction(route: GeoPoint[], fraction: number): GeoPoint {
  if (route.length === 0) throw new Error("pointAtFraction: empty route");
  if (route.length === 1) return route[0];

  const target = routeLengthKm(route) * Math.min(1, Math.max(0, fraction));
  let travelled = 0;
  for (let i = 1; i < route.length; i += 1) {
    const segment = haversineKm(route[i - 1], route[i]);
    if (travelled + segment >= target) {
      const t = segment === 0 ? 0 : (target - travelled) / segment;
      return lerp(route[i - 1], route[i], t);
    }
    travelled += segment;
  }
  return route[route.length - 1];
}
