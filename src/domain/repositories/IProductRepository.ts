import type { Product } from "../entities/Product";

export type IProductRepository = {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getFeatured(): Promise<Product[]>;
  getByCategory(categoryId: string): Promise<Product[]>;
  getSpecialOffers(): Promise<Product[]>;
  /** Products related to `productId` (same category first), excluding itself. */
  getSimilar(productId: string): Promise<Product[]>;
}
