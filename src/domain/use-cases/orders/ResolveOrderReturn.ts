import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

/** An admin's ruling on a pending return request. */
export type ReturnDecision = "approve" | "reject";

/**
 * Resolve a pending return request — the admin dashboard action. `approve`
 * refunds: the order goes to `refunded` (archived), its items are returned to
 * the shelf and the total is credited to the *customer's* wallet. `reject`
 * sends the order back to `completed`, with no money or stock movement.
 *
 * As with cancellation, the state change is claimed with a guarded transition
 * from `return_requested` first, so only the winning call runs the refund side
 * effects — a double approval can't refund twice.
 */
export class ResolveOrderReturn {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly notifier: IOrderNotifier,
  ) {}

  async execute(orderId: string, decision: ReturnDecision): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (order.status !== "return_requested") {
      throw new ValidationError("order", "This order has no pending return request.");
    }

    if (decision === "reject") {
      const rejected = await this.orderRepo.transitionStatus(orderId, {
        from: { status: "return_requested" },
        to: { status: "completed" },
      });
      if (!rejected) throw new ValidationError("order", "This order has no pending return request.");
      return rejected;
    }

    const refunded = await this.orderRepo.transitionStatus(orderId, {
      from: { status: "return_requested" },
      to: { status: "refunded", phase: "previous" },
    });
    // Lost the race — another admin already resolved it. Don't refund again.
    if (!refunded) throw new ValidationError("order", "This order has no pending return request.");

    await this.productRepo.incrementStock(
      refunded.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
    );
    await this.walletRepo.addFunds(refunded.userId, refunded.total, "Refund for returned order");

    // Tell the customer their return was approved and refunded. Best-effort: the
    // refund has already committed, so the notifier swallows any delivery failure.
    await this.notifier.returnApproved(refunded);

    return refunded;
  }
}
