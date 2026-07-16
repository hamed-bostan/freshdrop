import type { Product } from "@/src/domain/entities/Product";
import type { IFavoriteRepository } from "@/src/domain/repositories/IFavoriteRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";

/**
 * Product ids the demo user has "favorited", spanning several categories so the
 * category filter on the favorites screen has variety. Listed in the order they
 * should appear; ids that no longer exist in the catalog are skipped.
 */
const FAVORITE_IDS = [
  "1-1", // Organic Baby Spinach — Vegetables
  "1-3", // Vine Tomatoes — Vegetables
  "3-1", // Norwegian Salmon Fillet — Meat & Fish
  "3-3", // Lean Beef Mince — Meat & Fish
  "2-1", // Cage-Free Eggs — Dairy
  "2-3", // Whole Milk — Dairy
  "5-1", // Sparkling Spring Water — Drinks
  "5-3", // Classic Cola — Drinks
  "6-1", // Bananas — Fruits
  "11-1", // Milk Chocolate Bar — Sweets
  "11-3", // Caramel Fudge — Sweets
  "13-1", // Craft Lager 4-Pack — Alcoholic Drink
  "13-3", // Sauvignon Blanc — Alcoholic Drink
];

/**
 * Resolves the favorited ids against the product catalog. Depends on the product
 * repository (not the catalog directly) so favorites stay decoupled from how
 * products are stored — Dependency Inversion, same as the composition root.
 *
 * Favorites are held in a mutable in-memory Set seeded from FAVORITE_IDS. As the
 * container binds this as a singleton, toggles persist for the life of the server
 * process (a stand-in for a per-user store until favorites get real persistence).
 */
export class MockFavoriteRepository implements IFavoriteRepository {
  private readonly favoriteIds: Set<string>;

  constructor(private readonly products: IProductRepository) {
    this.favoriteIds = new Set(FAVORITE_IDS);
  }

  async getFavorites(locale?: string): Promise<Product[]> {
    // Resolve through the product repo in the active locale so favorited products
    // read in the user's language (like the catalog/cart/order paths).
    const all = await this.products.getAll(locale);
    const byId = new Map(all.map((product) => [product.id, product]));

    // Set preserves insertion order, so seeded favorites keep their listed order
    // and newly added ones append; ids no longer in the catalog are skipped.
    return [...this.favoriteIds]
      .map((id) => byId.get(id))
      .filter((product): product is Product => product != null);
  }

  async isFavorite(productId: string): Promise<boolean> {
    return this.favoriteIds.has(productId);
  }

  async addFavorite(productId: string): Promise<void> {
    this.favoriteIds.add(productId);
  }

  async removeFavorite(productId: string): Promise<void> {
    this.favoriteIds.delete(productId);
  }
}
