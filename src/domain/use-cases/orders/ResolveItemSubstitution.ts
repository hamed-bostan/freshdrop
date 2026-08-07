import { activityValue } from "../../entities/ActivityEntry";
import { isFullyRefunded, isPicking, refundForLineValue } from "../../entities/Order";
import { taxShareOfRefund } from "../../entities/Refund";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

import type { ActivityActor, NewActivityEntry } from "../../entities/ActivityEntry";
import type { ItemSubstitution, Order } from "../../entities/Order";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IUnitOfWork, TransactionalRepositories } from "../../repositories/IUnitOfWork";


/**
 * A picker's resolution of an out-of-stock line:
 * - `substitute` — swap it for `replacementProductId` (only valid when the
 *   customer pre-approved substitution for that line).
 * - `refund` — drop the line and refund its value.
 */
export type ItemSubstitutionResolution =
  | { action: "substitute"; replacementProductId: string }
  | { action: "refund" };

export type ResolveItemSubstitutionInput = {
  /** The order being picked. */
  orderId: string;
  /** The out-of-stock line (by product id). */
  productId: string;
  resolution: ItemSubstitutionResolution;
  /** The picker making the call, for the activity log. */
  actor: ActivityActor;
};

/**
 * Resolve an out-of-stock line during picking — the picker action behind the
 * dashboard's out-of-stock control. Grocery pickers hit out-of-stocks constantly
 * (the shelf is empty even though the digital count wasn't), so this honours the
 * substitution preference the customer pre-approved at checkout.
 *
 * `substitute` is allowed only on a line the customer marked `substitute`; it
 * claims a unit of the replacement's stock (atomic — a replacement that's also
 * short is refused so the picker can pick another) and refunds any price saving
 * (the customer is never charged more than they pre-approved — the store absorbs
 * a pricier swap). `refund` drops the line and credits its value; it's always a
 * valid fallback, and the only option on a `refund` line.
 *
 * Refunds are the amount the customer *effectively paid*, not the sticker price:
 * a line's value is refunded net of its pro-rata share of the order discount, and
 * the delivery fee is never refunded on a partial out-of-stock (the standard
 * grocery rule — see {@link refundForLineValue}). As with cancellation/returns no
 * money is charged — the wallet is only ever *credited*, and the order `total` is
 * left as originally charged; the refund/saving lands in the wallet. The
 * resolution is claimed with a guarded write so only the winning call runs the
 * side effects — a double pick can't refund twice.
 */
export class ResolveItemSubstitution {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly uow: IUnitOfWork,
    private readonly notifier: IOrderNotifier,
  ) {}

  async execute({
    orderId,
    productId,
    resolution,
    actor,
  }: ResolveItemSubstitutionInput): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (!isPicking(order)) {
      throw new ValidationError("order", "This order isn't being picked, so its items can't be substituted.");
    }

    const item = order.items.find((line) => line.productId === productId);
    if (!item) throw new NotFoundError("order item", productId);
    if (item.substitution) {
      throw new ValidationError("productId", "This item has already been resolved.");
    }

    if (resolution.action === "refund") {
      return this.refund(order, item, actor);
    }

    return this.substitute(order, item, resolution.replacementProductId, actor);
  }

  /**
   * One entry per resolved line.
   *
   * The line — not the order — is the subject, so `item` names which one. It's
   * still filed under the order, because that's what someone opens when a customer
   * asks why they were sent something else: an entity type of "order line" would
   * scatter a single order's picking decisions across ids nobody holds.
   *
   * Written *after* the guarded resolve in both paths, so a pick that lost the race
   * doesn't record a decision it never made.
   */
  private entry(
    actor: ActivityActor,
    order: Order,
    item: string,
    outcome: string,
    refunded: number,
  ): NewActivityEntry {
    return {
      actorId: actor.id,
      actorName: actor.name,
      action: "order.itemSubstituted",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.id,
      changes: [
        // The line went from what the customer ordered to what they're getting —
        // a replacement's name, or nothing at all when it was refunded out.
        { field: "item", before: item, after: outcome },
        ...(refunded > 0
          ? [{ field: "refunded", before: null, after: activityValue(refunded) }]
          : []),
      ],
    };
  }

  /**
   * Drop the line and credit the customer the amount they effectively paid for it
   * — `grossLineValue` net of its pro-rata share of the order discount.
   */
  private async refund(order: Order, item: Order["items"][number], actor: ActivityActor): Promise<Order> {
    const productId = item.productId;
    const itemName = item.name;
    const amount = refundForLineValue(order, item.price * item.quantity);
    const resolved: ItemSubstitution = { status: "refunded", refundAmount: amount };
    // The line's own snapshotted tax share (already net of its pro-rata discount,
    // see `OrderItem.taxAmount`) — the whole line is dropped, so its whole tax
    // share is what's being refunded. `null` (tax not in effect) reads as 0.
    const taxAmount = item.taxAmount ?? 0;

    // The line resolution, its refund, and the cancellation-plus-delivery-refund
    // that a last remaining line triggers are one transaction. Split apart, a
    // failure between them drops a line from the order without paying for it.
    const { updated, cancelled } = await this.uow.run(async ({ orders, wallets, refunds }) => {
      // The entry rides inside the guarded write, so only the pick that actually
      // resolved the line records having done so.
      const saved = await orders.resolveItemSubstitution(order.id, productId, resolved, (line) =>
        this.entry(actor, line, itemName, "refunded", amount),
      );
      // Lost the race — another pick already resolved this line. Throwing rolls
      // back, so nothing was refunded twice.
      if (!saved) throw new ValidationError("productId", "This item has already been resolved.");

      if (amount > 0) {
        await wallets.addFunds(order.userId, amount, { kind: "refundOutOfStock", item: itemName });
        await refunds.record({
          orderId: order.id,
          userId: order.userId,
          kind: "substitution",
          amount,
          taxAmount,
          actorId: actor.id,
          actorName: actor.name,
          lines: [{ orderItemId: item.id, productId, quantity: item.quantity, amount, taxAmount }],
        });
      }

      // If this refund resolved the order's last remaining line, there's nothing
      // left to deliver — cancel the order and refund the delivery fee too, rather
      // than charging for an empty delivery.
      if (isFullyRefunded(saved)) {
        return { updated: saved, cancelled: await this.cancelEmptied(orders, wallets, refunds, saved) };
      }
      return { updated: saved, cancelled: null };
    });

    // Notifications go after the commit, never inside it — they can't be rolled
    // back. The cancellation notice supersedes the per-item one: the customer
    // hears the order was cancelled and fully refunded, not that one line changed.
    if (cancelled) {
      await this.notifier.orderCancelledOutOfStock(cancelled);
      return cancelled;
    }

    await this.notifier.itemRefunded(updated, itemName);
    return updated;
  }

  /**
   * Every line is now refunded (see {@link isFullyRefunded}), so the order has
   * nothing left to deliver. Cancel it and refund the delivery fee too — the
   * standard grocery rule for a fully out-of-stock order (cancel and fully refund,
   * delivery included), instead of leaving a charged delivery for an empty order.
   *
   * Done through the guarded {@link IOrderRepository.transitionStatus} so the
   * shipping refund runs exactly once even under a double-pick/race — mirroring
   * how {@link CancelOrder} credits and transitions. Unlike cancellation, though,
   * the refunded lines are deliberately NOT restocked: they were physically out of
   * stock, so re-incrementing would create phantom inventory.
   *
   * Takes the caller's transaction-scoped repositories rather than the instance's,
   * so this joins the refund it was triggered by instead of committing separately.
   * Resolves `null` when the guard didn't match — a concurrent pick already
   * cancelled or advanced the order. That is *not* an error: the line refund this
   * ran inside still stands and must still commit, so it returns rather than
   * throwing and rolling the whole thing back.
   */
  private async cancelEmptied(
    orders: TransactionalRepositories["orders"],
    wallets: TransactionalRepositories["wallets"],
    refunds: TransactionalRepositories["refunds"],
    order: Order,
  ): Promise<Order | null> {
    const cancelled = await orders.transitionStatus(order.id, {
      from: { status: "processing", stage: "confirmed" },
      // Every line has already been refunded to the wallet during picking and the
      // shipping goes back below, so the order is fully repaid — payment reads
      // `refunded` to match, the same invariant `CancelOrder` upholds.
      to: { status: "cancelled", phase: "previous", stage: null, paymentStatus: "refunded" },
    });
    if (!cancelled) return null;

    if (cancelled.shipping > 0) {
      await wallets.addFunds(order.userId, cancelled.shipping, { kind: "refundCancelledOrderDelivery" });
      // The delivery fee is excluded from the taxable base (phase 3), so its
      // refund carries no VAT — no line either, it isn't tied to a product.
      await refunds.record({
        orderId: cancelled.id,
        userId: order.userId,
        kind: "substitution",
        amount: cancelled.shipping,
        taxAmount: 0,
        lines: [],
      });
    }
    return cancelled;
  }

  /** Swap the line for `replacementProductId`, refunding any price saving. */
  private async substitute(
    order: Order,
    item: Order["items"][number],
    replacementProductId: string,
    actor: ActivityActor,
  ): Promise<Order> {
    if (item.substitutionPreference !== "substitute") {
      throw new ValidationError("productId", "The customer didn't approve substituting this item.");
    }
    if (replacementProductId === item.productId) {
      throw new ValidationError("replacementProductId", "Pick a different product as the replacement.");
    }

    const replacement = await this.productRepo.getById(replacementProductId);
    if (!replacement) throw new NotFoundError("product", replacementProductId);

    // Refund the saving when the replacement is cheaper, net of the line's
    // pro-rata discount share; never charge more (a pricier swap clamps to 0, so
    // the store absorbs it and the customer is only charged what they pre-approved).
    const saving = refundForLineValue(order, (item.price - replacement.price) * item.quantity);
    const resolved: ItemSubstitution = {
      status: "substituted",
      replacement: { productId: replacement.id, name: replacement.name, imageUrl: replacement.imageUrl },
      refundAmount: saving,
    };

    const updated = await this.uow.run(async ({ orders, products, wallets, refunds }) => {
      // Claim a real unit of the replacement's stock first (atomic — throws
      // InsufficientStockError if it's short, so the picker picks another).
      await products.decrementStock(
        [{ productId: replacement.id, name: replacement.name, quantity: item.quantity }],
        // A substitution sells the replacement into an existing order, so it's a
        // sale like any other — the order it's attributed to is what says which.
        { reason: "sale", orderId: order.id },
      );

      const saved = await orders.resolveItemSubstitution(order.id, item.productId, resolved, (line) =>
        this.entry(actor, line, item.name, replacement.name, saving),
      );
      // Lost the race after claiming the replacement's stock. This used to need a
      // compensating `incrementStock` to avoid leaking the unit; inside the
      // transaction the rollback *is* the compensation, and unlike a manual one it
      // cannot itself fail and leave the leak behind.
      if (!saved) throw new ValidationError("productId", "This item has already been resolved.");

      // Only the wallet moves — the order total is left as charged.
      if (saving > 0) {
        await wallets.addFunds(order.userId, saving, { kind: "substitutionSaving", item: item.name });
        // The saving is a fraction of the line's value, not the whole line, so its
        // VAT share is derived from the order's rate rather than reused from
        // `item.taxAmount` — and 0 outright when the line itself is exempt.
        const taxAmount = item.taxExempt ? 0 : taxShareOfRefund(saving, order.taxRate);
        await refunds.record({
          orderId: order.id,
          userId: order.userId,
          kind: "substitution",
          amount: saving,
          taxAmount,
          actorId: actor.id,
          actorName: actor.name,
          lines: [{ orderItemId: item.id, productId: item.productId, quantity: item.quantity, amount: saving, taxAmount }],
        });
      }

      return saved;
    });

    await this.notifier.itemSubstituted(updated, item.name, replacement.name);
    return updated;
  }
}
