import { z } from "zod";

import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";

/**
 * The shape the *admin* promo-code endpoints promise to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 *
 * Distinct from `cart/promo-code-response-schema.ts`, which describes the public
 * shape the storefront receives: this one carries the campaign window, the on/off
 * switch and the redemption counter — operator facts that deliberately never reach
 * a shopper's response body.
 *
 * The window ends are `.optional()` rather than nullable: the repository maps a
 * NULL column to `undefined`, matching the entity, and JSON drops the key entirely.
 */
export const adminPromoCodeResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  discountPercent: z.number(),
  active: z.boolean(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageCount: z.number(),
}) satisfies z.ZodType<AdminPromoCode>;

/** `GET /api/admin/promo-codes` answers with one page of the list. */
export const adminPromoCodePageResponseSchema = pageResponseSchema(adminPromoCodeResponseSchema);
