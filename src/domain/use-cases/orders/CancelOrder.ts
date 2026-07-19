import type { Order } from "../../entities/Order";
import { isCancellable } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
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
 *
 * All three writes are one transaction. The guard alone made the *decision*
 * exactly-once; it said nothing about the two writes that follow it, so a failure
 * after the transition left an order cancelled with its stock or its refund
 * missing — a state no retry repairs, because the guard now refuses the retry.
 */
export class CancelOrder {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute({ userId, orderId }: CancelOrderInput): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    // Owner mismatch is reported as "not found" so we don't leak the order's existence.
    if (!order || order.userId !== userId) throw new NotFoundError("order", orderId);

    if (!isCancellable(order)) {
      throw new ValidationError("order", "This order can no longer be cancelled.");
    }

    return this.uow.run(async ({ orders, products, wallets }) => {
      const cancelled = await orders.transitionStatus(orderId, {
        from: { status: "processing", stage: "confirmed" },
        to: { status: "cancelled", phase: "previous", stage: null },
      });
      // The guard didn't match: the order advanced (shipped/cancelled) between our
      // read and the write. Throwing rolls the transaction back, so bailing here
      // needs no undo — nothing has been written.
      if (!cancelled) {
        throw new ValidationError("order", "This order can no longer be cancelled.");
      }

      // Back on the shelf, attributed to the order that's giving it back — the
      // ledger reads as "returned by order X", not as stock appearing from nowhere.
      await products.incrementStock(
        cancelled.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
        { reason: "restock", orderId: cancelled.id },
      );
      await wallets.addFunds(userId, cancelled.total, { kind: "refundCancelledOrder" });

      return cancelled;
    });
  }
}
