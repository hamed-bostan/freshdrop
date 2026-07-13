import type { Product } from "../entities/Product";
import type { ProductFilters } from "../entities/ProductFilters";

/**
 * A product before it exists. The admin controls these fields; everything derived
 * (id, ratings, `discountPercent`) is filled in by the repository on create.
 */
export type NewProduct = Omit<Product, "id" | "discountPercent" | "rating" | "ratingCount" | "images">;

/** One line of a stock decrement: which product, its name (for error messages), and how many units. */
export type StockAdjustment = {
  productId: string;
  name: string;
  quantity: number;
};

export type IProductRepository = {
  // `locale` selects the language for user-facing text (name/unit/accordion copy):
  // omitted or the default locale returns the canonical (base row) copy; a supported
  // locale overlays its translation, falling back field-by-field to the base row.
  getAll(locale?: string): Promise<Product[]>;
  getById(id: string, locale?: string): Promise<Product | null>;
  getFeatured(locale?: string): Promise<Product[]>;
  getSpecialOffers(locale?: string): Promise<Product[]>;
  /** Catalog search over name/description plus category, price, dietary and brand filters. At least one criterion is always set. */
  search(filters: ProductFilters, locale?: string): Promise<Product[]>;
  /** Products related to `productId` (same category first), excluding itself. */
  getSimilar(productId: string, locale?: string): Promise<Product[]>;
  create(input: NewProduct): Promise<Product>;
  update(id: string, input: NewProduct): Promise<Product>;
  delete(id: string): Promise<void>;

  /**
   * Atomically reduce on-hand stock for each line, all-or-nothing: if any line
   * can't be fully satisfied (not enough units, or the product is gone) nothing is
   * decremented and `InsufficientStockError` is thrown. This is the overselling
   * guard at checkout — the check and the decrement happen as one operation so
   * concurrent orders can't both pass a stale read and drive stock negative.
   */
  decrementStock(lines: readonly StockAdjustment[]): Promise<void>;

  /**
   * Return stock to the shelf — the inverse of {@link decrementStock}, used when
   * an order is cancelled or a return is approved. Adds each line's units back to
   * on-hand stock; lines whose product no longer exists are skipped (nothing to
   * credit), so restocking never fails on a since-deleted product.
   */
  incrementStock(lines: readonly StockAdjustment[]): Promise<void>;
}
