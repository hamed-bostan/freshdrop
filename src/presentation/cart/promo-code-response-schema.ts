import { z } from "zod";

import type { PromoCode } from "@/src/domain/entities/PromoCode";

/**
 * The shape a promo-code endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`).
 */
export const promoCodeResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  discountPercent: z.number(),
}) satisfies z.ZodType<PromoCode>;

export const promoCodeListResponseSchema = z.array(promoCodeResponseSchema);
