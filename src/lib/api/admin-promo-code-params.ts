import {
  PROMO_CODE_STATUSES,
  type AdminPromoCodeFilters,
  type PromoCodeStatus,
} from "@/src/domain/entities/PromoCode";

/**
 * The wire contract for the promo-code list's filters — shared by the dashboard
 * toolbar (which serialises them into the URL) and the admin route (which parses
 * them back), the same split `admin-product-params.ts` uses for the catalog list.
 *
 * Query-param names: `q`, `status`. Paging and ordering ride in the same query
 * string but are parsed separately by `pagination-params.ts`.
 */

const STATUS_SET = new Set<string>(PROMO_CODE_STATUSES);

/** Parse promo-code list filters from a `URLSearchParams`, dropping blank/unrecognised values. */
export function parseAdminPromoCodeFilters(params: URLSearchParams): AdminPromoCodeFilters {
  const filters: AdminPromoCodeFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  // Only a recognised state, so a hand-edited URL can't reach the repository
  // asking for a status `getPromoCodeStatus` never produces.
  const status = params.get("status");
  if (status && STATUS_SET.has(status)) filters.status = status as PromoCodeStatus;

  return filters;
}

/** Serialise promo-code list filters into query params, omitting anything unset. */
export function buildAdminPromoCodeParams(filters: AdminPromoCodeFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  return params;
}
