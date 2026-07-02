import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";

export type ReorderItemsInput = {
  /** The user reordering — the order must belong to them. */
  userId: string;
  /** The past order whose lines are being added back to the cart. */
  orderId: string;
};

export type ReorderItemsResult = {
  /** Distinct lines added back to the cart. */
  added: number;
  /** Lines skipped because the product is no longer in the catalog. */
  skipped: number;
};

/**
 * Add a past order's items back into the user's working cart — the "Reorder"
 * action. Each line is accumulated onto the cart (existing quantities grow), so
 * reordering never clears what the user already has. Products that have since
 * left the catalog are skipped rather than failing the whole action, matching
 * how large stores reorder "available items" and quietly drop the rest; the
 * caller can surface the counts. Stock isn't claimed here — that happens at
 * checkout, where the overselling guard lives.
 */
export class ReorderItems {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute({ userId, orderId }: ReorderItemsInput): Promise<ReorderItemsResult> {
    const order = await this.orderRepo.getById(orderId);
    // Scope to the owner: a mismatched owner is reported as "not found" so an
    // order's existence isn't leaked to another user.
    if (!order || order.userId !== userId) throw new NotFoundError("order", orderId);

    let added = 0;
    let skipped = 0;

    for (const item of order.items) {
      const product = await this.productRepo.getById(item.productId);
      if (!product) {
        skipped += 1;
        continue;
      }
      await this.cartRepo.addItem(userId, item.productId, item.quantity);
      added += 1;
    }

    return { added, skipped };
  }
}
