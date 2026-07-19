import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { ItemSubstitution, Order } from "../../entities/Order";
import { isFullyRefunded, isPicking, refundForLineValue } from "../../entities/Order";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { recordActivity } from "../activity/recordActivity";

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
    private readonly walletRepo: IWalletRepository,
    private readonly notifier: IOrderNotifier,
    private readonly activityLog: IActivityLog,
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
      return this.refund(order, productId, item.name, item.price * item.quantity, actor);
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
  private async record(
    actor: ActivityActor,
    order: Order,
    item: string,
    outcome: string,
    refunded: number,
  ): Promise<void> {
    await recordActivity(this.activityLog, {
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
    });
  }

  /**
   * Drop the line and credit the customer the amount they effectively paid for it
   * — `grossLineValue` net of its pro-rata share of the order discount.
   */
  private async refund(
    order: Order,
    productId: string,
    itemName: string,
    grossLineValue: number,
    actor: ActivityActor,
  ): Promise<Order> {
    const amount = refundForLineValue(order, grossLineValue);
    const resolved: ItemSubstitution = { status: "refunded", refundAmount: amount };
    const updated = await this.orderRepo.resolveItemSubstitution(order.id, productId, resolved);
    // Lost the race — another pick already resolved this line. Don't refund again.
    if (!updated) throw new ValidationError("productId", "This item has already been resolved.");

    if (amount > 0) {
      await this.walletRepo.addFunds(order.userId, amount, { kind: "refundOutOfStock", item: itemName });
    }

    await this.record(actor, updated, itemName, "refunded", amount);

    // If this refund resolved the order's last remaining line, there's nothing
    // left to deliver — cancel the order and refund the delivery fee too, rather
    // than charging for an empty delivery. The cancellation notice supersedes the
    // per-item one (the customer hears the order was cancelled and fully refunded).
    if (isFullyRefunded(updated)) {
      return this.cancelEmptied(updated);
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
   */
  private async cancelEmptied(order: Order): Promise<Order> {
    const cancelled = await this.orderRepo.transitionStatus(order.id, {
      from: { status: "processing", stage: "confirmed" },
      to: { status: "cancelled", phase: "previous", stage: null },
    });
    // Lost the race — a concurrent pick already cancelled/advanced the order. The
    // line refund still stands; just don't refund shipping or notify twice.
    if (!cancelled) return order;

    if (cancelled.shipping > 0) {
      await this.walletRepo.addFunds(order.userId, cancelled.shipping, { kind: "refundCancelledOrderDelivery" });
    }
    await this.notifier.orderCancelledOutOfStock(cancelled);
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

    // Claim a real unit of the replacement's stock first (atomic — throws
    // InsufficientStockError if it's short, so the picker picks another).
    await this.productRepo.decrementStock(
      [{ productId: replacement.id, name: replacement.name, quantity: item.quantity }],
      // A substitution sells the replacement into an existing order, so it's a
      // sale like any other — the order it's attributed to is what says which.
      { reason: "sale", orderId: order.id },
    );

    // Refund the saving when the replacement is cheaper, net of the line's
    // pro-rata discount share; never charge more (a pricier swap clamps to 0, so
    // the store absorbs it and the customer is only charged what they pre-approved).
    const saving = refundForLineValue(order, (item.price - replacement.price) * item.quantity);
    const resolved: ItemSubstitution = {
      status: "substituted",
      replacement: { productId: replacement.id, name: replacement.name, imageUrl: replacement.imageUrl },
      refundAmount: saving,
    };
    const updated = await this.orderRepo.resolveItemSubstitution(order.id, item.productId, resolved);
    if (!updated) {
      // Lost the race after claiming the replacement's stock — return it so the
      // unclaimed swap doesn't leak a unit (the same self-healing seam CreateOrder
      // accepts for the slot claim).
      await this.productRepo.incrementStock(
        [{ productId: replacement.id, name: replacement.name, quantity: item.quantity }],
        { reason: "restock", orderId: order.id },
      );
      throw new ValidationError("productId", "This item has already been resolved.");
    }

    // Only the wallet moves — the order total is left as charged.
    if (saving > 0) {
      await this.walletRepo.addFunds(order.userId, saving, { kind: "substitutionSaving", item: item.name });
    }

    await this.record(actor, updated, item.name, replacement.name, saving);

    await this.notifier.itemSubstituted(updated, item.name, replacement.name);
    return updated;
  }
}
