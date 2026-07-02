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
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getFeatured(): Promise<Product[]>;
  getSpecialOffers(): Promise<Product[]>;
  /** Catalog search over name/description plus category, price, dietary and brand filters. At least one criterion is always set. */
  search(filters: ProductFilters): Promise<Product[]>;
  /** Products related to `productId` (same category first), excluding itself. */
  getSimilar(productId: string): Promise<Product[]>;
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
