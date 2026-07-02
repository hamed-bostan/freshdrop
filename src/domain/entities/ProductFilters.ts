/**
 * Catalog filter vocabulary and the filter criteria the search use-case accepts.
 * Framework-free domain constants: the storefront filter UI reads its options
 * from here, the API validates query params against them, and the seed data is
 * tagged from the same lists — one source of truth so options never drift from
 * the products that carry them.
 */

/** Dietary tags a product can carry; a product may hold several. */
export const DIETARY_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Organic", "Dairy-Free"] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

/**
 * Result orderings the search supports. `name` (A–Z) is the default; the rest map
 * to a single column each in the repository.
 */
export const PRODUCT_SORTS = ["name", "price-asc", "price-desc", "rating"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
export const DEFAULT_PRODUCT_SORT: ProductSort = "name";

/** Brands stocked in the catalog — the option list for the brand filter. */
export const PRODUCT_BRANDS = [
  "Fresh Fields",
  "Green Valley",
  "Golden Harvest",
  "Riverside",
  "Pantry Co.",
  "Nature's Best",
] as const;
export type Brand = (typeof PRODUCT_BRANDS)[number];

/**
 * Criteria for a catalog search. Every field is optional and combines with AND
 * (a product must satisfy all supplied criteria); `dietary`/`brands` match ANY of
 * their values. An all-empty filter is "no search" — the use-case returns nothing
 * rather than the whole catalog.
 */
export type ProductFilters = {
  /** Free-text term matched against name and description. */
  query?: string;
  categoryId?: string;
  /** Inclusive price bounds. */
  minPrice?: number;
  maxPrice?: number;
  /** Match products carrying ANY of these dietary tags. */
  dietary?: string[];
  /** Match products from ANY of these brands. */
  brands?: string[];
  /** Result ordering; defaults to `name` when omitted. */
  sort?: ProductSort;
};

/**
 * True when the filters carry at least one *matching* criterion. `sort` alone
 * doesn't count — there's nothing to order without a search — so a bare sort
 * resolves to no results rather than the whole catalog.
 */
export function hasProductSearchCriteria(filters: ProductFilters): boolean {
  return (
    filters.query != null ||
    filters.categoryId != null ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    (filters.dietary?.length ?? 0) > 0 ||
    (filters.brands?.length ?? 0) > 0
  );
}
