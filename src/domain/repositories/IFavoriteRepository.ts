import type { Product } from "../entities/Product";

export type IFavoriteRepository = {
  /**
   * The current user's favorited products. `locale` selects the language for the
   * products' user-facing text (name/unit): omitted or the default locale returns
   * canonical copy, a supported locale overlays its translation.
   */
  getFavorites(locale?: string): Promise<Product[]>;
  /** Whether the given product is in the current user's favorites. */
  isFavorite(productId: string): Promise<boolean>;
  /** Add a product to favorites (idempotent — re-adding is a no-op). */
  addFavorite(productId: string): Promise<void>;
  /** Remove a product from favorites (idempotent — removing a non-favorite is a no-op). */
  removeFavorite(productId: string): Promise<void>;
}
