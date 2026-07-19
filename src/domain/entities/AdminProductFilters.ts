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
 * Stock levels the list can be narrowed to — the same three states the storefront
 * classifies with, reused rather than restated so "low" always means the same
 * thing here as it does in `getStockStatus`. This is what the overview's
 * "needs restocking" tile links into (`?stock=low`).
 */
export const ADMIN_STOCK_FILTERS = ["in", "low", "out"] as const;
export type AdminStockFilter = StockStatus["level"];

export type AdminProductFilters = {
  /** Free-text term matched against name and description. */
  query?: string;
  categoryId?: string;
  /** Narrow to one stock state; omitted means every state. */
  stock?: AdminStockFilter;
};
