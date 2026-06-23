import type { Product } from "../entities/Product";

export interface IFavoriteRepository {
  /** The current user's favorited products. */
  getFavorites(): Promise<Product[]>;
}
