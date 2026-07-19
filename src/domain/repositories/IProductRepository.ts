import type { Product } from "../entities/Product";
import type { AdminProductFilters, AdminProductSort } from "../entities/AdminProductFilters";
import type { Page, PageRequest } from "../entities/Pagination";
import type { ProductFilters } from "../entities/ProductFilters";
import type { AuditHook } from "./AuditHook";
import type { StockMovementReason } from "../entities/StockMovement";

/**
 * One locale's content overrides for a product — the admin-authored translation.
 * `name` is required (the base row's name is never blank); the rest fall back to the
 * base row field-by-field when omitted.
 */
export type ProductTranslationInput = {
  locale: string;
  name: string;
  unit?: string;
  description?: string;
  nutrition?: string;
  origin?: string;
};

/**
 * A product before it exists. The admin controls these fields; everything derived
 * (id, ratings, `discountPercent`) is filled in by the repository on create.
 *
 * `translations` carries the per-locale content to persist alongside the base row:
 * `undefined` leaves any existing translations untouched, while a list *replaces*
 * them (locales absent from it are removed, so `[]` clears all).
 */
export type NewProduct = Omit<Product, "id" | "discountPercent" | "rating" | "ratingCount" | "images"> & {
  translations?: ProductTranslationInput[];
};

/** One line of a stock decrement: which product, its name (for error messages), and how many units. */
export type StockAdjustment = {
  productId: string;
  name: string;
  quantity: number;
};

/**
 * Who made a stock change. Snapshotted into the ledger entry rather than looked up
 * on read, so history survives the account being renamed or removed.
 */
export type StockMovementActor = {
  id: string;
  name: string;
};

/**
 * Everything a ledger entry needs beyond the quantity itself. Passed to each
 * method that moves stock, which writes the entry in the same transaction as the
 * change — so there's no way to move stock without saying why.
 *
 * Attribution is either an operator (`actor`) or an order (`orderId`); see
 * {@link StockMovement}. Both being absent is what an unattributable change would
 * look like, and no caller has one.
 */
export type StockMovementContext = {
  reason: StockMovementReason;
  /** Free-text detail an operator typed alongside the reason. */
  note?: string;
  /** The admin behind a manual adjustment. */
  actor?: StockMovementActor;
  /** The order behind a sale, cancellation, return or substitution. */
  orderId?: string;
};

export type IProductRepository = {
  // `locale` selects the language for user-facing text (name/unit/accordion copy):
  // omitted or the default locale returns the canonical (base row) copy; a supported
  // locale overlays its translation, falling back field-by-field to the base row.
  getAll(locale?: string): Promise<Product[]>;
  getById(id: string, locale?: string): Promise<Product | null>;
  /**
   * Resolve several products at once, for screens that hold a set of product ids
   * and need to label them (the moderation queue's rows, an order's lines).
   *
   * Missing ids are simply absent from the result rather than an error — the
   * callers are display surfaces, and a review whose product was deleted should
   * still be moderatable. Ordering isn't promised; callers key by id.
   */
  getByIds(ids: readonly string[], locale?: string): Promise<Product[]>;
  getFeatured(locale?: string): Promise<Product[]>;
  getSpecialOffers(locale?: string): Promise<Product[]>;
  /** Catalog search over name/description plus category, price, dietary and brand filters. At least one criterion is always set. */
  search(filters: ProductFilters, locale?: string): Promise<Product[]>;
  /**
   * One page of the catalog-management list, plus the total matching the filters.
   *
   * Separate from {@link getAll} rather than an optional argument on it: `getAll`
   * promises the whole catalog and several storefront reads depend on that, while
   * this one promises a slice and the count it was cut from. An empty filter here
   * means the whole catalog, paged.
   */
  listPage(
    filters: AdminProductFilters,
    page: PageRequest<AdminProductSort>,
    locale?: string,
  ): Promise<Page<Product>>;
  /** Products related to `productId` (same category first), excluding itself. */
  getSimilar(productId: string, locale?: string): Promise<Product[]>;
  /**
   * `actor` is who to credit the opening stock to in the ledger — a product
   * created with units already on hand starts its history with an entry saying
   * so, instead of a level that appears from nowhere. Omitted for a product
   * created empty (there's no movement to record).
   */
  create(input: NewProduct, actor?: StockMovementActor, audit?: AuditHook<Product>): Promise<Product>;
  /**
   * `actor` is who to attribute a stock change to. The full edit form can move
   * stock like any other field, so when `stockQuantity` differs from the stored
   * value the repository records a `correction` for the difference in the same
   * transaction — the edit form is not a back door around the ledger.
   */
  update(id: string, input: NewProduct, actor?: StockMovementActor, audit?: AuditHook<Product>): Promise<Product>;
  /** `audit` records the deletion inside the same transaction — the entry is the only record the product ever existed. */
  delete(id: string, audit?: AuditHook<void>): Promise<void>;

  /**
   * Apply a signed `delta` to one product's on-hand stock and record why, as one
   * atomic operation. The narrow counterpart to {@link update}: adjusting stock
   * from the catalog list must not require sending — or re-validating — an entire
   * product the operator isn't touching.
   *
   * Refuses to drive stock below zero: a removal larger than what's on hand
   * throws `InsufficientStockError` and changes nothing, so a stray extra digit
   * can't leave the catalog in a state the schema's CHECK constraint would have
   * rejected anyway. `NotFoundError` when the product is gone.
   */
  adjustStock(
    productId: string,
    delta: number,
    context: StockMovementContext,
    audit?: AuditHook<Product>,
  ): Promise<Product>;
  /** The stored per-locale translations for a product (for the admin edit form); empty when none. */
  getTranslations(productId: string): Promise<ProductTranslationInput[]>;

  /**
   * Atomically reduce on-hand stock for each line, all-or-nothing: if any line
   * can't be fully satisfied (not enough units, or the product is gone) nothing is
   * decremented and `InsufficientStockError` is thrown. This is the overselling
   * guard at checkout — the check and the decrement happen as one operation so
   * concurrent orders can't both pass a stale read and drive stock negative.
   *
   * `context` names the order the units left for; its ledger entries land in the
   * same transaction, so an oversell rollback takes them with it.
   */
  decrementStock(lines: readonly StockAdjustment[], context: StockMovementContext): Promise<void>;

  /**
   * Return stock to the shelf — the inverse of {@link decrementStock}, used when
   * an order is cancelled or a return is approved. Adds each line's units back to
   * on-hand stock; lines whose product no longer exists are skipped (nothing to
   * credit), so restocking never fails on a since-deleted product — and a skipped
   * line writes no ledger entry, since no stock moved.
   */
  incrementStock(lines: readonly StockAdjustment[], context: StockMovementContext): Promise<void>;
}
