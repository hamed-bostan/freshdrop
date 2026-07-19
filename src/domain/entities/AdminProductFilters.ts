import type { StockStatus } from "./stock";

/**
 * Filter and sort vocabulary for the *catalog management* list — deliberately not
 * `ProductFilters`, which is the storefront's search vocabulary.
 *
 * They look similar and mean different things. A shopper filters by dietary tag,
 * brand and price band and never sees a product's stock level as a filter; an
 * operator filters by stock level and category and never by "Vegan". Folding both
 * into one type would give each side a set of criteria the other's UI can't
 * produce and its repository has no reason to honour. An empty filter here means
 * "the whole catalog, paged" — the opposite of `ProductFilters`, where an empty
 * filter means "no search, no results".
 */

/** Columns the management list can be ordered by; each maps to a single column in the repository. */
export const ADMIN_PRODUCT_SORTS = ["name", "price", "stock", "createdAt"] as const;
export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number];

/** Newest first — an operator's default question is "what changed lately", not "what's alphabetically first". */
export const DEFAULT_ADMIN_PRODUCT_SORT: AdminProductSort = "createdAt";
export const DEFAULT_ADMIN_PRODUCT_DIRECTION = "desc";

/**
 * Stock levels the list can be narrowed to.
 *
 * The first three are the storefront's own states, reused rather than restated so
 * "low" always means the same thing here as it does in `getStockStatus`.
 *
 * `needsRestock` is the operator's question rather than the shopper's: *low or
 * out*, everything not comfortably in stock. It exists because it's what the
 * overview's "needs restocking" tile counts, and a tile whose number doesn't
 * match the list it opens is worse than one that doesn't link at all. Expressing
 * it as a filter value keeps that link a plain `?stock=needsRestock` instead of a
 * bespoke screen — and it's the view an operator actually wants on a restocking
 * round, where "out" and "one left" are the same job.
 */
export const ADMIN_STOCK_FILTERS = ["needsRestock", "in", "low", "out"] as const;
export type AdminStockFilter = StockStatus["level"] | "needsRestock";

export type AdminProductFilters = {
  /** Free-text term matched against name and description. */
  query?: string;
  categoryId?: string;
  /** Narrow to one stock state; omitted means every state. */
  stock?: AdminStockFilter;
};
