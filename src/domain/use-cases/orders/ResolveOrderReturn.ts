import type { ActivityActor, NewActivityEntry } from "../../entities/ActivityEntry";
import { activityValue, singleChange } from "../../entities/ActivityEntry";
import type { Order } from "../../entities/Order";
import type { RefundLine } from "../../entities/Refund";
import { round2 } from "@/src/lib/money";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import type { IReturnRepository } from "../../repositories/IReturnRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

/** An admin's ruling on a pending return request. */
export type ReturnDecision = "approve" | "reject";

/**
 * Resolve a pending return request — the admin dashboard action. `approve`
 * refunds: the order goes to `refunded` (archived), the *inspected* items whose
 * recovery decision is `restocked` go back to the shelf, and the customer's
 * wallet is credited the sum of what the `ReturnRequest`'s items were valued at
 * — not `order.total` unconditionally, since a return can cover only some of
 * the order's lines. `reject` sends the order back to `completed`, with no
 * money or stock movement.
 *
 * As with cancellation, the state change is claimed with a guarded transition
 * from `return_requested` first, so only the winning call runs the refund side
 * effects — a double approval can't refund twice.
 *
 * The transition, the restock, the wallet credit and the audit entry are one
 * transaction. An approval that moved the order to `refunded` but failed before
 * crediting the customer is the worst outcome this path has — the customer has
 * given the goods back and been charged for them — and it is exactly what a
 * sequence of independent writes permits.
 */
export class ResolveOrderReturn {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly uow: IUnitOfWork,
    private readonly notifier: IOrderNotifier,
    private readonly returnRepo: IReturnRepository,
  ) {}

  async execute(orderId: string, decision: ReturnDecision, actor: ActivityActor): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (order.status !== "return_requested") {
      throw new ValidationError("order", "This order has no pending return request.");
    }

    // A rejection moves nothing but the status, so it needs no unit of work — the
    // guarded transition and its audit entry are already one write.
    if (decision === "reject") {
      // The entry rides *inside* the guarded transition, here and below, so only
      // the call that actually resolved the return writes one — a lost race
      // changes nothing and records nothing (see `transitionStatus`).
      const rejected = await this.orderRepo.transitionStatus(
        orderId,
        { from: { status: "return_requested" }, to: { status: "completed" } },
        (resolved) => this.entry(actor, resolved, "reject", order.status),
      );
      if (!rejected) throw new ValidationError("order", "This order has no pending return request.");

      const pending = await this.returnRepo.getForOrder(orderId);
      if (pending && pending.status !== "resolved" && pending.status !== "rejected") {
        await this.returnRepo.resolve(pending.id, "rejected");
      }
      return rejected;
    }

    const refunded = await this.uow.run(async ({ orders, products, wallets, refunds, returns }) => {
      // Read the return request *before* transitioning, so the amount actually
      // refunded is known in time to land on the audit entry the transition
      // writes — the entry is otherwise built from a snapshot that predates the
      // computation (see `entry`).
      const returnRequest = await returns.getForOrder(orderId);

      let refundAmount: number;
      let refundTaxAmount: number;
      let refundLines: RefundLine[];
      let restock: { productId: string; name: string; quantity: number }[];

      if (returnRequest) {
        refundAmount = round2(returnRequest.items.reduce((sum, item) => sum + item.refundAmount, 0));
        refundTaxAmount = round2(returnRequest.items.reduce((sum, item) => sum + item.taxAmount, 0));
        refundLines = returnRequest.items.map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          quantity: item.quantity,
          amount: item.refundAmount,
          taxAmount: item.taxAmount,
        }));
        // Restock only what inspection actually decided to put back on the
        // shelf — an item that skipped inspection (`recoveryDecision`
        // `undefined`) or was decided as damaged/disposed/etc. doesn't restock.
        restock = returnRequest.items
          .filter((item) => item.recoveryDecision === "restocked")
          .map((item) => {
            const line = order.items.find((oi) => oi.id === item.orderItemId);
            return { productId: item.productId, name: line?.name ?? item.productId, quantity: item.quantity };
          });
      } else {
        // No `ReturnRequest` on record — an order that reached `return_requested`
        // before this model existed. Falls back to the order-wide behaviour this
        // replaces, so an in-flight legacy request still resolves correctly.
        refundAmount = order.total;
        refundTaxAmount = order.taxAmount ?? 0;
        refundLines = [];
        restock = order.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity }));
      }

      const resolved = await orders.transitionStatus(
        orderId,
        {
          from: { status: "return_requested" },
          // Payment follows the wallet credit below into `refunded`, in the same
          // atomic write — see `CancelOrder` for the same reasoning.
          to: { status: "refunded", phase: "previous", paymentStatus: "refunded" },
        },
        (updated) => this.entry(actor, updated, "approve", order.status, refundAmount),
      );
      // Lost the race — another admin already resolved it. Throwing rolls back,
      // so nothing has been refunded and there is nothing to undo.
      if (!resolved) throw new ValidationError("order", "This order has no pending return request.");

      if (restock.length > 0) {
        // The returned goods go back on the shelf, attributed to the order they
        // came back from rather than to the admin who approved the return — the
        // units moved because of the return, not because someone counted the shelf.
        await products.incrementStock(restock, { reason: "restock", orderId: resolved.id });
      }
      if (refundAmount > 0) {
        await wallets.addFunds(resolved.userId, refundAmount, { kind: "refundReturnedOrder" });
        // Ledger row for the credit above — the admin's approval is the actor of
        // record, same as the activity entry above.
        await refunds.record({
          orderId: resolved.id,
          userId: resolved.userId,
          kind: "return",
          amount: refundAmount,
          taxAmount: refundTaxAmount,
          actorId: actor.id,
          actorName: actor.name,
          lines: refundLines,
        });
      }
      if (returnRequest) {
        await returns.resolve(returnRequest.id, "resolved");
      }

      return resolved;
    });

    // Outside the transaction, and necessarily: a notification can't be rolled
    // back, so sending one inside would mean telling a customer their money is
    // back and then discarding the refund. Best-effort — the refund has committed,
    // so a delivery failure must not fail the call.
    await this.notifier.returnApproved(refunded);

    return refunded;
  }

  /**
   * One entry for the ruling. The decision rides alongside the status move because
   * the two aren't the same fact: `reject` and a stage rewind both land an order
   * back on `completed`, and only the decision says which happened. An approval
   * moves money, so the refunded amount is on the entry too — it's the number
   * anyone auditing this will want, and the order's total can be edited by later
   * substitutions (and, since a return can cover only some of the order, need not
   * equal it).
   */
  private entry(
    actor: ActivityActor,
    order: Order,
    decision: ReturnDecision,
    fromStatus: Order["status"],
    refundedAmount?: number,
  ): NewActivityEntry {
    return {
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
          ? [{ field: "refunded", before: null, after: activityValue(refundedAmount ?? 0) }]
          : []),
      ],
    };
  }
}
