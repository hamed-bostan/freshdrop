import {
  ADMIN_STOCK_FILTERS,
  ADMIN_VISIBILITY_FILTERS,
  type AdminProductFilters,
  type AdminStockFilter,
  type AdminVisibilityFilter,
} from "@/src/domain/entities/AdminProductFilters";

/**
 * The wire contract for the catalog-management list's filters — shared by the
 * dashboard toolbar (which serialises them into the URL) and the admin route
 * (which parses them back), the same split `product-search-params.ts` uses for
 * the storefront's catalog search.
 *
 * Query-param names: `q`, `categoryId`, `stock`, `visibility`. Paging and ordering ride in the
 * same query string but are parsed separately by `pagination-params.ts`.
 */

const STOCK_SET = new Set<string>(ADMIN_STOCK_FILTERS);
const VISIBILITY_SET = new Set<string>(ADMIN_VISIBILITY_FILTERS);

/** Parse management-list filters from a `URLSearchParams`, dropping blank/unrecognised values. */
export function parseAdminProductFilters(params: URLSearchParams): AdminProductFilters {
  const filters: AdminProductFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const categoryId = params.get("categoryId")?.trim();
  if (categoryId) filters.categoryId = categoryId;

  // Only a recognised stock level, so a hand-edited URL can't reach the repository
  // with a state `getStockStatus` never produces.
  const stock = params.get("stock");
  if (stock && STOCK_SET.has(stock)) filters.stock = stock as AdminStockFilter;

  // Absent means both states — the management list deliberately shows withdrawn
  // products alongside live ones.
  const visibility = params.get("visibility");
  if (visibility && VISIBILITY_SET.has(visibility)) {
    filters.visibility = visibility as AdminVisibilityFilter;
  }

  return filters;
}

/** Serialise management-list filters into query params, omitting anything unset. */
export function buildAdminProductParams(filters: AdminProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.stock) params.set("stock", filters.stock);
  if (filters.visibility) params.set("visibility", filters.visibility);
  return params;
}
