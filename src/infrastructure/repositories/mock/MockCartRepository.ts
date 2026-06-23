import type { CartItem } from "@/src/domain/entities/Cart";
import type { ICartRepository } from "@/src/domain/repositories/ICartRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";

/**
 * The cart's seeded contents: just product references and quantities. The full
 * product snapshot (name, image, price, copy) is resolved from the catalog at
 * read time — the cart only stores what the user chose, not a copy of the
 * product, so it stays decoupled from how products are stored (same Dependency
 * Inversion as favorites/orders).
 */
const CART_SEED: { productId: string; quantity: number }[] = [
  { productId: "6-2", quantity: 1 }, // Royal Gala Apples
  { productId: "3-1", quantity: 1 }, // Norwegian Salmon Fillet
  { productId: "3-3", quantity: 1 }, // Lean Beef Mince
  { productId: "10-1", quantity: 1 }, // Sourdough Loaf
  { productId: "2-1", quantity: 2 }, // Cage-Free Eggs
  { productId: "5-1", quantity: 3 }, // Sparkling Spring Water
];

/**
 * In-memory cart backed by the product catalog. State lives in a single
 * `productId → quantity` map (insertion-ordered, so the list stays stable) and
 * is resolved against `IProductRepository` on every read. A process singleton —
 * mutations persist for the lifetime of the dev server, which is all the mock
 * needs until a real cart store is wired in.
 */
export class MockCartRepository implements ICartRepository {
  private readonly quantities = new Map<string, number>(
    CART_SEED.map(({ productId, quantity }) => [productId, quantity]),
  );

  constructor(private readonly products: IProductRepository) {}

  async getItems(): Promise<CartItem[]> {
    const all = await this.products.getAll();
    const byId = new Map(all.map((product) => [product.id, product]));

    return [...this.quantities.entries()]
      .map(([productId, quantity]) => {
        const product = byId.get(productId);
        return product ? { product, quantity } : null;
      })
      .filter((item): item is CartItem => item != null);
  }

  async addItem(productId: string, quantity: number): Promise<void> {
    const current = this.quantities.get(productId) ?? 0;
    this.quantities.set(productId, current + quantity);
  }

  async removeItem(productId: string): Promise<void> {
    this.quantities.delete(productId);
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      this.quantities.delete(productId);
      return;
    }
    this.quantities.set(productId, quantity);
  }

  async clear(): Promise<void> {
    this.quantities.clear();
  }
}
