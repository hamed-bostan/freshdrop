import { z } from "zod";
import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";

/**
 * The shape the admin delivery-window endpoints promise to return, validated at
 * the typed-service boundary (see `parseApiResponse`).
 *
 * Distinct from `checkout/delivery-slot-response-schema.ts`, which describes the
 * dated, availability-checked *slots* the storefront receives. This is the
 * recurring window definition an operator edits; that is the schedule it produces.
 */
export const deliveryWindowResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  startMinutes: z.number(),
  endMinutes: z.number(),
  capacity: z.number(),
  position: z.number(),
}) satisfies z.ZodType<DeliveryWindow>;

/** The catalog endpoint answers with the whole ordered list — it's short and hand-ordered. */
export const deliveryWindowListResponseSchema = z.array(deliveryWindowResponseSchema);
