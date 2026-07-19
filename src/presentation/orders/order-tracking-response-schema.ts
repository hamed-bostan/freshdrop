import { z } from "zod";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";

/**
 * The shape the tracking endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`). Shared by the storefront's tracking read and
 * poll and by the dashboard's stage mutation, which resolves with refreshed tracking.
 *
 * The one response the client leans on hardest: the courier coordinate and route
 * drive a Leaflet map, where a malformed `latitude` doesn't throw — it silently
 * puts the marker in the sea. Coordinates are range-checked (WGS 84) rather than
 * merely typed, mirroring the domain's `isValidGeoPoint`.
 */
const geoPointResponseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const orderTrackingResponseSchema = z.object({
  orderId: z.string(),
  deliveryAddress: z.string(),
  destination: geoPointResponseSchema,
  courier: geoPointResponseSchema,
  /** `null` before dispatch and once arrived — there's no live estimate then. */
  etaMinutes: z.number().nullable(),
  route: z.array(geoPointResponseSchema),
  steps: z.array(
    z.object({
      // No `label`: the milestone is the machine key, and the copy is localized in
      // the presentation layer. Same for the rider's job title below.
      milestone: z.enum(["confirmed", "shipped", "arrived"]),
      occurredAt: z.string().optional(),
      status: z.enum(["done", "current", "pending"]),
    }),
  ),
  rider: z.object({
    name: z.string(),
    avatarUrl: z.string(),
    phone: z.string(),
  }),
}) satisfies z.ZodType<OrderTracking>;
