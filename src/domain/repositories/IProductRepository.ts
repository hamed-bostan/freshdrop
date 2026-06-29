import type { Product } from "../entities/Product";

/**
 * A product before it exists. The admin controls these fields; everything derived
 * (id, ratings, `discountPercent`) is filled in by the repository on create.
 */
export type NewProduct = Omit<Product, "id" | "discountPercent" | "rating" | "ratingCount" | "images">;

export type IProductRepository = {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getFeatured(): Promise<Product[]>;
  getByCategory(categoryId: string): Promise<Product[]>;
  getSpecialOffers(): Promise<Product[]>;
  /** Products related to `productId` (same category first), excluding itself. */
  getSimilar(productId: string): Promise<Product[]>;
  create(input: NewProduct): Promise<Product>;
  update(id: string, input: NewProduct): Promise<Product>;
  delete(id: string): Promise<void>;
}
