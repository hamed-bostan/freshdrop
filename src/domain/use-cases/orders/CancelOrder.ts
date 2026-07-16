import type { Order } from "../../entities/Order";
import { isCancellable } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

export type CancelOrderInput = {
  /** The user cancelling — the order must belong to them. */
  userId: string;
  /** The order being cancelled. */
  orderId: string;
};

/**
 * Cancel a live order before it ships — the customer "Cancel" action. Only
 * pre-dispatch orders qualify (see `isCancellable`); once shipped the customer
 * must return instead.
 *
 * The state change is claimed with a guarded transition first: it flips the
 * order to `cancelled` (archived, untrackable) *only if* it's still exactly the
 * cancellable state, atomically. That single winner then gets the compensating
 * side effects — stock returned to the shelf and the total refunded to the
 * wallet — so a double-submit or a race with a stage advance can't refund twice
 * or cancel an already-shipped order.
 */
export class CancelOrder {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly walletRepo: IWalletRepository,
  ) {}

  async execute({ userId, orderId }: CancelOrderInput): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    // Owner mismatch is reported as "not found" so we don't leak the order's existence.
    if (!order || order.userId !== userId) throw new NotFoundError("order", orderId);

    if (!isCancellable(order)) {
      throw new ValidationError("order", "This order can no longer be cancelled.");
    }

    const cancelled = await this.orderRepo.transitionStatus(orderId, {
      from: { status: "processing", stage: "confirmed" },
      to: { status: "cancelled", phase: "previous", stage: null },
    });
    // The guard didn't match: the order advanced (shipped/cancelled) between our
    // read and the write. Bail without touching stock or the wallet.
    if (!cancelled) {
      throw new ValidationError("order", "This order can no longer be cancelled.");
    }

    await this.productRepo.incrementStock(
      cancelled.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
    );
    await this.walletRepo.addFunds(userId, cancelled.total, { kind: "refundCancelledOrder" });

    return cancelled;
  }
}
