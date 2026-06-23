import type { Order } from "../entities/Order";

export interface IOrderRepository {
  /** The current user's orders, newest first. */
  getOrders(): Promise<Order[]>;
}
