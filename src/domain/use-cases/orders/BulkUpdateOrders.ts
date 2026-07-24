import type { ActivityActor } from "../../entities/ActivityEntry";
import type { TrackingMilestone } from "../../entities/OrderTracking";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { CancelOrder } from "./CancelOrder";
import { SetOrderTrackingStage } from "./SetOrderTrackingStage";

/**
 * How many orders one bulk action may touch.
 *
 * Half the product cap, because these are not the same kind of write. A bulk
 * product change moves a column; each order here returns stock to the shelf,
 * credits a wallet, and may send the customer a message. A hundred of those is
 * already a lot to set in motion from one click.
 */
const MAX_BULK_ORDERS = 100;

/** What to do to the selection — the domain's half of `orderBulkActionSchema`. */
export type OrderBulkChange =
  | { type: "setStage"; stage: TrackingMilestone }
  | { type: "cancel" };

/**
 * Apply one action across a selection of orders — the order list's bulk bar.
 *
 * Delegates to the very use-cases the single-order controls call, rather than
 * reimplementing either. That is the whole design: cancelling an order restocks
 * it, refunds the wallet and guards against a double cancel, and a bulk path that
 * wrote the status directly would be a second, weaker definition of "cancelled"
 * that skipped all three. Anything true of cancelling one order is true of
 * cancelling twenty.
 *
 * **Not atomic, on purpose.** Each order is its own unit of work — its own
 * transaction over stock, wallet and status — and they are applied one after the
 * other. Wrapping the batch in a single transaction would mean one order that
 * can't take the action (already shipped, already cancelled) discards nineteen
 * refunds that were perfectly good. Partial progress is the correct outcome here;
 * an all-or-nothing batch would be the surprising one.
 *
 * Which is why it reports a count. Orders that couldn't take the action are
 * skipped, not failed, exactly as the products bulk path skips rows already
 * holding the target value — the screen tells the operator "8 of 12 updated"
 * instead of pretending the whole selection moved.
 */
export class BulkUpdateOrders {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly uow: IUnitOfWork,
    private readonly notifier: IOrderNotifier,
  ) {}

  /** Returns the ids the action actually moved. */
  async execute(
    ids: readonly string[],
    change: OrderBulkChange,
    actor: ActivityActor,
  ): Promise<string[]> {
    if (ids.length === 0) throw new ValidationError("ids", "Select at least one order.");
    if (ids.length > MAX_BULK_ORDERS) {
      throw new ValidationError("ids", `Select at most ${MAX_BULK_ORDERS} orders.`);
    }

    const setStage = new SetOrderTrackingStage(this.orderRepo, this.notifier);
    const cancel = new CancelOrder(this.orderRepo, this.uow);
    const updated: string[] = [];

    for (const id of ids) {
      try {
        if (change.type === "setStage") {
          await setStage.execute(id, change.stage, actor);
        } else {
          // Cancelled *as* the customer who placed it: `CancelOrder` is
          // owner-scoped, and the refund has to land in that customer's wallet
          // rather than in whoever is holding the dashboard. Looking the owner up
          // here is what makes an admin's cancel the same operation as theirs.
          const order = await this.orderRepo.getById(id);
          if (!order) continue;
          await cancel.execute({ userId: order.userId, orderId: id });
        }
        updated.push(id);
      } catch (error) {
        // A refusal is a skip: an order that can't take this action (already
        // shipped, already cancelled, gone) is a normal outcome of applying one
        // verb to a mixed selection, and must not stop the orders behind it.
        // Anything else is a real fault and stops the batch — a database that has
        // started failing will not do better on the ninety-ninth order, and
        // pressing on would turn one outage into a hundred half-applied writes.
        if (isSkippable(error)) continue;
        throw error;
      }
    }

    return updated;
  }
}

/**
 * Whether an error means "this order, specifically, can't take this action".
 *
 * `ValidationError` is what both use-cases throw when their guards refuse — not
 * yet dispatched, no longer cancellable, not trackable. A missing order is
 * `NotFoundError`, which is the same kind of answer: the id came from a page the
 * operator was looking at, and it may simply have been removed since.
 */
function isSkippable(error: unknown): boolean {
  return error instanceof ValidationError || error instanceof NotFoundError;
}
