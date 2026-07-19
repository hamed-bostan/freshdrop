import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import { apiPatch, apiPost, apiPut } from "@/src/lib/api/client";
import type { PromoCodeFormInput } from "@/src/contracts/promo-code-schema";
import { adminPromoCodeResponseSchema } from "./promo-code-admin-response-schema";

/**
 * Typed client for the promo-code REST *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data or
 * rejects with an `ApiError` — either normalized from the failure (see `client.ts`)
 * or raised because the response body didn't match the schema. Reads are
 * server-side (see `promoCodesServerApi`).
 *
 * There's no `remove`: a campaign is retired with `setActive(id, false)`. See
 * `SetPromoCodeActive` for why the row is never deleted.
 */
export const promoCodesApi = {
  create(values: PromoCodeFormInput): Promise<AdminPromoCode> {
    return apiPost("/admin/promo-codes", values, adminPromoCodeResponseSchema);
  },

  update(id: string, values: PromoCodeFormInput): Promise<AdminPromoCode> {
    return apiPut(`/admin/promo-codes/${id}`, values, adminPromoCodeResponseSchema);
  },

  /** Switch a campaign on or off — the one-field PATCH behind the table's toggle. */
  setActive(id: string, active: boolean): Promise<AdminPromoCode> {
    return apiPatch(`/admin/promo-codes/${id}`, { active }, adminPromoCodeResponseSchema);
  },
};
