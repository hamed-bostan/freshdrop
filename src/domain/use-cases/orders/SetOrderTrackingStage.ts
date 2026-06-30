import type { Order, OrderStatus } from "../../entities/Order";
import type { TrackingMilestone } from "../../entities/OrderTracking";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
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
 */
export class SetOrderTrackingStage {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(orderId: string, stage: TrackingMilestone): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    if (order.phase !== "current" || order.status === "cancelled") {
      throw new ValidationError("stage", "This order can't be tracked.");
    }

    const status: OrderStatus = stage === "arrived" ? "completed" : "processing";
    return this.orderRepo.setTrackingStage(orderId, { stage, status });
  }
}
