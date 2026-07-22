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

/**
 * The one field a bulk action sets, and what to set it to.
 *
 * A closed union rather than a partial `Product`: a bulk edit is only safe for
 * fields where "the same value for all of them" is a sensible thing to want.
 * Price, stock and name are emphatically not that — stock in particular has its own
 * ledgered path (`adjustStock`) that this must never become a way around — so they
 * aren't expressible here rather than merely discouraged.
 */
export type BulkProductChange =
  | { field: "isPublished"; value: boolean }
  | { field: "categoryId"; value: string };

/**
 * One product a bulk change actually altered, paired with how it looked first.
 *
 * The "before" travels with the result because the audit entry needs it — an entry
 * saying a product moved to Bakery is worth little without saying what it moved
 * from — and {@link AuditHook} is handed only the write's result. Products the
 * change would have been a no-op for never appear here at all.
 */
export type BulkProductUpdate = {
  product: Product;
  previous: Product;
};

export type IProductRepository = {
  // `locale` selects the language for user-facing text (name/unit/accordion copy):
  // omitted or the default locale returns the canonical (base row) copy; a supported
  // locale overlays its translation, falling back field-by-field to the base row.
  //
  // Visibility splits these reads in two, and the split is in the *names* rather
  // than in a `includeUnpublished` flag — a boolean parameter defaulting either way
  // is a trap, because the safe default for the storefront (hide) is the wrong one
  // for the dashboard (which must be able to open what it just unpublished), and
  // whichever way it defaulted, the call sites that got it wrong would still
  // compile. So: the storefront-only reads below filter unconditionally, and where
  // both sides need the same lookup there are two methods with different names.
  /** The published catalog, for the storefront. Unpublished products are excluded. */
  getAll(locale?: string): Promise<Product[]>;
  /**
   * One product in any visibility state — the dashboard's read, and the one every
   * write path checks against. Use {@link getPublishedById} for anything a shopper
   * reaches.
   */
  getById(id: string, locale?: string): Promise<Product | null>;
  /**
   * One product, but only if the storefront is allowed to show it — `null` for an
   * unpublished one, exactly as for an id that doesn't exist.
   *
   * This is what makes unpublishing mean something: it's the read behind the
   * product page, add-to-cart, favouriting, reordering and stock-alert signup, so a
   * withdrawn product can't be bought by anyone who kept the link, or silently
   * re-enter a cart through a reorder.
   */
  getPublishedById(id: string, locale?: string): Promise<Product | null>;
  /**
   * Resolve several products at once, for screens that hold a set of product ids
   * and need to label them (the moderation queue's rows, an order's lines).
   *
   * Missing ids are simply absent from the result rather than an error — the
   * callers are display surfaces, and a review whose product was deleted should
   * still be moderatable. Ordering isn't promised; callers key by id.
   *
   * Deliberately *not* filtered by visibility, unlike its single-product siblings.
   * These callers hold ids that already exist somewhere real — a line on a placed
   * order, an item in a cart, a saved favourite — and unpublishing a product must
   * not turn those into blanks. Withdrawing a product stops it being found and
   * bought; it doesn't rewrite the history of people who already did.
   */
  getByIds(ids: readonly string[], locale?: string): Promise<Product[]>;
  /** Featured products for the storefront rail. Published only. */
  getFeatured(locale?: string): Promise<Product[]>;
  /** Products carrying a badge, for the special-offers rail. Published only. */
  getSpecialOffers(locale?: string): Promise<Product[]>;
  /**
   * Catalog search over name/description plus category, price, dietary and brand
   * filters. At least one criterion is always set. Published only.
   */
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
   * Apply one field change to many products at once, returning the rows as
   * written. Backs the catalog list's bulk actions (publish/unpublish, move to
   * category).
   *
   * A single method with a narrow `BulkProductChange` rather than a
   * `setPublished` / `setCategory` pair, because the transaction shape is the
   * identical part and the field is the only thing that varies: read the rows that
   * will actually change, write them, and write one audit entry per product — all
   * in one transaction, so a bulk action is atomic and each product's own activity
   * panel shows what happened to it.
   *
   * `audit` is invoked per product, not per batch. Twenty products unpublished
   * together is twenty entries, one on each product's history, because that's where
   * anyone asking "why is this hidden?" will look — a single "unpublished 20
   * products" entry answers the question only for whoever already knew to look at
   * the batch.
   *
   * Ids that don't exist are skipped rather than raising, and products already
   * holding the target value are left alone and produce no entry — the same "record
   * changes, not clicks" rule {@link AuditHook} describes. So the returned array can
   * be shorter than `ids`, and its length is what the UI reports as "12 updated".
   */
  applyBulkChange(
    ids: readonly string[],
    change: BulkProductChange,
    audit?: AuditHook<BulkProductUpdate>,
  ): Promise<BulkProductUpdate[]>;

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
