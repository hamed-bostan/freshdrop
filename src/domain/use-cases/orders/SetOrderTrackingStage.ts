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

  async execute(orderId: string, stage: TrackingMilestone): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (order.phase !== "current" || order.status === "cancelled") {
      throw new ValidationError("stage", "This order can't be tracked.");
    }

    const status: OrderStatus = stage === "arrived" ? "completed" : "processing";
    const updated = await this.orderRepo.setTrackingStage(orderId, { stage, status });

    // Notify only on a real transition into the milestone — not on an idempotent
    // re-save of the stage the order is already at.
    if (order.stage !== stage) {
      if (stage === "shipped") await this.notifier.orderOutForDelivery(updated);
      else if (stage === "arrived") await this.notifier.orderDelivered(updated);
    }

    return updated;
  }
}
