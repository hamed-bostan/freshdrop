import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { serverApiGet } from "@/src/lib/api/server-client";

import { promoCodeListResponseSchema } from "./promo-code-response-schema";

/**
 * Server-side promo-code reads for Server Components (BFF) — the same REST
 * endpoint the cart screen reads, fetched during server render.
 */
export const promoCodesServerApi = {
  list(): Promise<PromoCode[]> {
    return serverApiGet("/promo-codes", promoCodeListResponseSchema);
  },

  /** Resolve a single code (case-insensitive); `null` when none matches. */
  async getByCode(code: string): Promise<PromoCode | null> {
    const matches = await serverApiGet("/promo-codes", promoCodeListResponseSchema, { params: { code } });
    return matches[0] ?? null;
  },
};
