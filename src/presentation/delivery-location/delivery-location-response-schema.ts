import { z } from "zod";

import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";

/**
 * The shape a delivery-address endpoint promises to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 *
 * The coordinate is optional (an address typed by hand has none) but range-checked
 * when present: these feed the map picker, where a bad latitude doesn't throw, it
 * just drops the pin somewhere wrong.
 */
export const deliveryLocationResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  city: z.string().optional(),
  kind: z.enum(["home", "office", "gym", "other"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean(),
}) satisfies z.ZodType<DeliveryLocation>;

export const deliveryLocationListResponseSchema = z.array(deliveryLocationResponseSchema);
