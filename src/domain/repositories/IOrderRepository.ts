import type { Order, OrderStatus } from "../entities/Order";
import type { TrackingMilestone } from "../entities/OrderTracking";

/** The fields a delivery-stage transition writes (computed by the use-case, persisted by the repo). */
export type OrderTrackingUpdate = {
  /** The milestone the order is being moved to. */
  stage: TrackingMilestone;
  /** The lifecycle status the milestone implies (e.g. `arrived` ⇒ `completed`). */
  status: OrderStatus;
};

/** Everything needed to persist a new order — an `Order` minus its generated id. */
export type NewOrder = Omit<Order, "id">;

export type IOrderRepository = {
  /** A user's orders, newest first. */
  getOrders(userId: string): Promise<Order[]>;

  /** Every order, newest first — the admin dashboard's cross-user view. */
  getAllOrders(): Promise<Order[]>;

  /** A single order by id, or `null` when none matches. */
  getById(orderId: string): Promise<Order | null>;

  /** Persist a newly placed order, returning it with its generated id. */
  createOrder(input: NewOrder): Promise<Order>;

  /**
   * Apply a delivery-stage transition to an order, returning the updated order.
   * Throws `NotFoundError` when no order matches `orderId`.
   */
  setTrackingStage(orderId: string, update: OrderTrackingUpdate): Promise<Order>;
}
