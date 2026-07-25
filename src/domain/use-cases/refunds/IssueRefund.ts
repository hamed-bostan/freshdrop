import type { ActivityActor, NewActivityEntry } from "../../entities/ActivityEntry";
import type { Order } from "../../entities/Order";
import { refundForLineValue } from "../../entities/Order";
import type { Refund, RefundLine } from "../../entities/Refund";
import { refundableRemaining, taxShareOfRefund } from "../../entities/Refund";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { round2 } from "@/src/lib/money";

/** One line to refund, and how many units of it — omitted means the whole line. */
export type RefundLineInput = { orderItemId: string; quantity?: number };

/**
 * What a discretionary refund covers: specific lines (a genuine line-item partial
 * refund) or a bare amount (a support gesture that doesn't map to particular
 * units — a delivery complaint, a goodwill credit).
 */
export type IssueRefundTarget =
  | { kind: "lines"; lines: RefundLineInput[] }
  | { kind: "amount"; amount: number };

export type IssueRefundInput = {
  orderId: string;
  /** Why — required here, unlike the guarded flows, which are self-explanatory. */
  reason: string;
  /** The admin issuing it, for the ledger row and the activity entry. */
  actor: ActivityActor;
  target: IssueRefundTarget;
};

/**
 * Half a cent — the float slop the cap comparison below must absorb. Amounts are
 * rounded to the cent everywhere they're computed, so a real overrun is never
 * this small; this only forgives representation error, not an actual overshoot.
 */
const CAP_EPSILON = 0.005;

/**
 * Issue a discretionary partial (or full) refund — the admin action for
 * everything the guarded flows don't cover: a customer complaint about part of
 * an order, a goodwill credit, a correction. Gated by `refunds.issue`
 * (admin/owner only — see `Permission.ts`), deliberately narrower than the
 * `orders.fulfill` return approval it sits beside.
 *
 * Unlike `CancelOrder`/`ResolveOrderReturn`/`ResolveItemSubstitution`, nothing
 * here transitions the order's status or claims stock — it only ever credits the
 * wallet for an amount still owed. The one invariant it must enforce itself is
 * the cap: total refunds on an order may never exceed `order.total`. Two admins
 * issuing refunds on the same order at once is exactly the race that could break
 * it, so the cap is rechecked *inside* a lock on the order row (see
 * `IOrderRepository.lockById`) rather than against the caller's stale read — the
 * loser of the race gets a `ValidationError`, not a double-spent refund.
 */
export class IssueRefund {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(input: IssueRefundInput): Promise<Order> {
    const order = await this.orderRepo.getById(input.orderId);
    if (!order) throw new NotFoundError("order", input.orderId);

    const reason = input.reason.trim();
    if (!reason) throw new ValidationError("reason", "A reason is required for a discretionary refund.");

    const { amount, taxAmount, lines } =
      input.target.kind === "lines" ? this.fromLines(order, input.target.lines) : this.fromAmount(order, input.target.amount);

    if (!(amount > 0)) throw new ValidationError("amount", "There's nothing to refund.");

    const { updated, refund } = await this.uow.run(async ({ orders, wallets, refunds }) => {
      const locked = await orders.lockById(order.id);
      if (!locked) throw new NotFoundError("order", order.id);

      const remaining = refundableRemaining(locked.total, locked.refunds);
      if (amount - remaining > CAP_EPSILON) {
        throw new ValidationError("amount", "This exceeds what's left to refund on this order.");
      }

      await wallets.addFunds(locked.userId, amount, { kind: "manualRefund" });
      const recorded = await refunds.record(
        {
          orderId: locked.id,
          userId: locked.userId,
          kind: "manual",
          amount,
          taxAmount,
          reason,
          actorId: input.actor.id,
          actorName: input.actor.name,
          lines,
        },
        (saved) => this.entry(input.actor, locked, saved),
      );

      return { updated: locked, refund: recorded };
    });

    return { ...updated, refunds: [...updated.refunds, refund] };
  }

  /**
   * Refund specific lines, each net of its pro-rata discount share (see
   * `refundForLineValue`) and capped at the line's own quantity. A tax-inclusive
   * line inherently refunds its VAT portion as part of `amount` — the split is
   * only recorded here, nothing extra is credited.
   */
  private fromLines(
    order: Order,
    lines: RefundLineInput[],
  ): { amount: number; taxAmount: number; lines: RefundLine[] } {
    if (lines.length === 0) throw new ValidationError("lines", "Choose at least one line to refund.");

    let amount = 0;
    let taxAmount = 0;
    const refundLines: RefundLine[] = [];

    for (const line of lines) {
      const item = order.items.find((candidate) => candidate.id === line.orderItemId);
      if (!item) throw new NotFoundError("order item", line.orderItemId);

      const quantity = line.quantity ?? item.quantity;
      if (quantity <= 0 || quantity > item.quantity) {
        throw new ValidationError(
          "lines",
          `Refund quantity for "${item.name}" must be between 1 and ${item.quantity}.`,
        );
      }

      const lineAmount = refundForLineValue(order, item.price * quantity);
      const lineTax = item.taxExempt ? 0 : taxShareOfRefund(lineAmount, order.taxRate);
      amount = round2(amount + lineAmount);
      taxAmount = round2(taxAmount + lineTax);
      refundLines.push({
        orderItemId: item.id,
        productId: item.productId,
        quantity,
        amount: lineAmount,
        taxAmount: lineTax,
      });
    }

    return { amount, taxAmount, lines: refundLines };
  }

  /** A bare amount with no line breakdown — its VAT share is derived from the order's rate. */
  private fromAmount(order: Order, amount: number): { amount: number; taxAmount: number; lines: RefundLine[] } {
    if (!(amount > 0)) throw new ValidationError("amount", "Enter an amount greater than zero.");
    const rounded = round2(amount);
    return { amount: rounded, taxAmount: taxShareOfRefund(rounded, order.taxRate), lines: [] };
  }

  private entry(actor: ActivityActor, order: Order, refund: Refund): NewActivityEntry {
    return {
      actorId: actor.id,
      actorName: actor.name,
      action: "order.refundIssued",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.id,
      changes: [
        { field: "refunded", before: null, after: String(refund.amount) },
        { field: "reason", before: null, after: refund.reason ?? null },
      ],
    };
  }
}
