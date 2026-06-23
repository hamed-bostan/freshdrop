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
 */
export class MockFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly products: IProductRepository) {}

  async getFavorites(): Promise<Product[]> {
    const all = await this.products.getAll();
    const byId = new Map(all.map((product) => [product.id, product]));

    return FAVORITE_IDS.map((id) => byId.get(id)).filter((product): product is Product => product != null);
  }
}
