import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import type { Page } from "@/src/domain/entities/Pagination";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import {
  adminPromoCodePageResponseSchema,
  adminPromoCodeResponseSchema,
} from "./promo-code-admin-response-schema";

/**
 * Server-side promo-code reads for the admin dashboard (BFF). Fetched during
 * server render so the data arrives with the page instead of after a client
 * round-trip; `serverApiGet` forwards the admin's session cookie so the admin
 * endpoint authorizes the call. Mutations go through the browser `promoCodesApi`,
 * which then `router.refresh()`es to re-run these reads.
 */
export const promoCodesServerApi = {
  /** One page of the list, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<Page<AdminPromoCode>> {
    return serverApiGet("/admin/promo-codes", adminPromoCodePageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },

  /** Resolve a campaign by id; `null` on 404 so callers can `notFound()`. */
  async getById(id: string): Promise<AdminPromoCode | null> {
    try {
      return await serverApiGet(`/admin/promo-codes/${id}`, adminPromoCodeResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
