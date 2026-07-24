import type { ActivityActor } from "../../entities/ActivityEntry";
import { diffFields } from "../../entities/ActivityEntry";
import type { Order, OrderStatus } from "../../entities/Order";
import type { TrackingMilestone } from "../../entities/OrderTracking";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Advance (or rewind) an order's delivery milestone — the write behind the admin
 * dashboard's stage control. Enforces the same trackability rule the customer
 * tracking screen relies on (only live, non-cancelled orders can be tracked), so
 * a direct caller can't push a stage onto an archived or cancelled order.
 *
 * A trackable order's lifecycle status follows its stage: reaching the
 * destination (`arrived`) marks it `completed` (delivered); any earlier stage is
 * still in progress (`processing`). Phase is left untouched — a just-delivered
 * order stays under "current" per the order grouping rules.
 *
 * Crossing into a customer-facing milestone fires a notification: `shipped` →
 * "out for delivery", `arrived` → "delivered". It fires only on an actual change
 * of stage, so re-setting the same stage (an idempotent admin save) doesn't send
 * a duplicate SMS. Best-effort, so a delivery failure never fails the stage save.
 */
export class SetOrderTrackingStage {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly notifier: IOrderNotifier,
  ) {}

  /**
   * `defer`, when given, receives this stage change's customer notification
   * instead of it being sent inline. It exists for the bulk path: a hundred stage
   * advances would otherwise each block on an SMS send, summing a hundred network
   * round-trips into one request. The single-order caller omits it and the send
   * happens as before — one advance, one awaited notification, no reason to defer.
   */
  async execute(
    orderId: string,
    stage: TrackingMilestone,
    actor: ActivityActor,
    defer?: (dispatch: () => Promise<void>) => void,
  ): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (order.phase !== "current" || order.status === "cancelled") {
      throw new ValidationError("stage", "This order can't be tracked.");
    }

    const status: OrderStatus = stage === "arrived" ? "completed" : "processing";
    // Recorded inside the transaction that moves the stage, on the same "real
    // transition" test the notification uses and for a related reason: marking an
    // order delivered is a claim about the physical world that the customer is told
    // about and can dispute. The log answers "who marked this delivered, and when"
    // — including the case that matters most, an order rewound out of a stage it
    // had already reached.
    const updated = await this.orderRepo.setTrackingStage(orderId, { stage, status }, (saved) => {
      const changes = diffFields(
        { stage: order.stage, status: order.status },
        { stage: saved.stage, status: saved.status },
      );
      if (changes.length === 0) return null;
      return {
        actorId: actor.id,
        actorName: actor.name,
        action: "order.stageChanged",
        entityType: "order",
        entityId: saved.id,
        entityLabel: saved.id,
        changes,
      };
    });

    // Notify only on a real transition into the milestone — not on an idempotent
    // re-save of the stage the order is already at.
    const dispatch = async (): Promise<void> => {
      if (order.stage === stage) return;
      if (stage === "shipped") await this.notifier.orderOutForDelivery(updated);
      else if (stage === "arrived") await this.notifier.orderDelivered(updated);
    };

    // Inline for a single advance; handed to the caller for a batch to fan out
    // concurrently once the serial database work is done.
    if (defer) defer(dispatch);
    else await dispatch();

    return updated;
  }
}
