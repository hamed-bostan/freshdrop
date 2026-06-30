import type { CartItem } from "@/src/domain/entities/Cart";
import type { ICartRepository } from "@/src/domain/repositories/ICartRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * A user's cart backed by PostgreSQL via Prisma. Each row stores only a product
 * reference + quantity; the full product snapshot is resolved from the catalog at
 * read time (so the cart stays decoupled from how products are stored, the same
 * Dependency Inversion as orders/favorites). Server-side only — bound through the
 * container, never imported by client code.
 */
export class PrismaCartRepository implements ICartRepository {
  constructor(private readonly products: IProductRepository) {}

  async getItems(userId: string): Promise<CartItem[]> {
    const rows = await prisma.cartItem.findMany({
      where: { userId },
      // Insertion order (with a deterministic tiebreak) so the list stays stable.
      orderBy: [{ createdAt: "asc" }, { productId: "asc" }],
    });
    if (rows.length === 0) return [];

    const all = await this.products.getAll();
    const byId = new Map(all.map((product) => [product.id, product]));

    return rows
      .map((row) => {
        const product = byId.get(row.productId);
        return product ? { product, quantity: row.quantity } : null;
      })
      .filter((item): item is CartItem => item != null);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<void> {
    // Adding an existing line accumulates onto its quantity.
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    // deleteMany (not delete) so removing an absent line is a no-op, never a throw.
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(userId, productId);
      return;
    }
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity },
    });
  }

  async clear(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
}
