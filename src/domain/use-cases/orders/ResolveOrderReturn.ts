import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue, singleChange } from "../../entities/ActivityEntry";
import type { Order } from "../../entities/Order";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { recordActivity } from "../activity/recordActivity";

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
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(orderId: string, decision: ReturnDecision, actor: ActivityActor): Promise<Order> {
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

      // Recorded *after* the guarded transition, here and below, so only the call
      // that actually resolved the return writes an entry. Logging before it would
      // give a lost race an entry for a decision it never made.
      await this.record(actor, rejected, "reject", order.status);
      return rejected;
    }

    const refunded = await this.orderRepo.transitionStatus(orderId, {
      from: { status: "return_requested" },
      to: { status: "refunded", phase: "previous" },
    });
    // Lost the race — another admin already resolved it. Don't refund again.
    if (!refunded) throw new ValidationError("order", "This order has no pending return request.");

    // The returned goods go back on the shelf, attributed to the order they came
    // back from rather than to the admin who approved the return — the units moved
    // because of the return, not because someone counted the shelf.
    await this.productRepo.incrementStock(
      refunded.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
      { reason: "restock", orderId: refunded.id },
    );
    await this.walletRepo.addFunds(refunded.userId, refunded.total, { kind: "refundReturnedOrder" });

    await this.record(actor, refunded, "approve", order.status);

    // Tell the customer their return was approved and refunded. Best-effort: the
    // refund has already committed, so the notifier swallows any delivery failure.
    await this.notifier.returnApproved(refunded);

    return refunded;
  }

  /**
   * One entry for the ruling. The decision rides alongside the status move because
   * the two aren't the same fact: `reject` and a stage rewind both land an order
   * back on `completed`, and only the decision says which happened. An approval
   * moves money, so the refunded amount is on the entry too — it's the number
   * anyone auditing this will want, and the order's total can be edited by later
   * substitutions.
   */
  private async record(
    actor: ActivityActor,
    order: Order,
    decision: ReturnDecision,
    fromStatus: Order["status"],
  ): Promise<void> {
    await recordActivity(this.activityLog, {
      actorId: actor.id,
      actorName: actor.name,
      action: "order.returnResolved",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.id,
      changes: [
        ...singleChange("status", fromStatus, order.status),
        { field: "decision", before: null, after: decision },
        ...(decision === "approve"
          ? [{ field: "refunded", before: null, after: activityValue(order.total) }]
          : []),
      ],
    });
  }
}
