import type { OrderTracking } from "../entities/OrderTracking";

export interface IOrderTrackingRepository {
  /** Live tracking for an order, or `null` if the order can't be tracked. */
  getByOrderId(orderId: string): Promise<OrderTracking | null>;
}
