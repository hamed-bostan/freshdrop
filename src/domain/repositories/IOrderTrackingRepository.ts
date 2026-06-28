import type { OrderTracking } from "../entities/OrderTracking";

export type IOrderTrackingRepository = {
  /** Live tracking for an order, or `null` if the order can't be tracked. */
  getByOrderId(orderId: string): Promise<OrderTracking | null>;
}
