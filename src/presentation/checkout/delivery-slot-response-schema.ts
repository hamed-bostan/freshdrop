import { z } from "zod";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";

/**
 * The shape the delivery-slot endpoint promises to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 *
 * `availability` is a discriminated union in the domain — only `low` carries a
 * `remaining` count — so it's parsed as one: a `low` slot arriving without its
 * count is a real mismatch, not a slot with `undefined` left.
 */
const slotAvailabilityResponseSchema = z.discriminatedUnion("level", [
  z.object({ level: z.literal("full") }),
  z.object({ level: z.literal("low"), remaining: z.number() }),
  z.object({ level: z.literal("open") }),
]);

export const deliverySlotDayResponseSchema = z.object({
  date: z.string(),
  label: z.string(),
  // The day's today/tomorrow standing so other locales can localize the label;
  // `null` for later days (see `RelativeDay`).
  relativeDay: z.enum(["today", "tomorrow"]).nullable(),
  slots: z.array(
    z.object({
      windowId: z.string(),
      label: z.string(),
      timeRange: z.string(),
      availability: slotAvailabilityResponseSchema,
    }),
  ),
}) satisfies z.ZodType<DeliverySlotDay>;

export const deliverySlotDayListResponseSchema = z.array(deliverySlotDayResponseSchema);
