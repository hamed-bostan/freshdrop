import type { Product } from "../entities/Product";
import type { ProductFilters } from "../entities/ProductFilters";

/**
 * A product before it exists. The admin controls these fields; everything derived
 * (id, ratings, `discountPercent`) is filled in by the repository on create.
 */
export type NewProduct = Omit<Product, "id" | "discountPercent" | "rating" | "ratingCount" | "images">;

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
}
