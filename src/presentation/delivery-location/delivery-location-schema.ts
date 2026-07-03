import { z } from "zod";
import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";

/**
 * The single source of truth for adding a delivery address, shared by the client
 * add-address flow and the REST route handler (defensive re-validation — never
 * trust the client). The owner (userId) is taken from the session server-side, so
 * it never travels over the wire.
 */
export const deliveryLocationSchema = z.object({
  address: z.string().trim().min(1, "Enter an address."),
  kind: z.enum(["home", "office", "gym", "other"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type DeliveryLocationInput = z.infer<typeof deliveryLocationSchema>;

/** Display name shown on the address card, derived from the selected `kind`. */
export const DELIVERY_LOCATION_LABELS: Record<DeliveryLocationKind, string> = {
  home: "Home",
  office: "Office",
  gym: "Gym",
  other: "Other",
};
