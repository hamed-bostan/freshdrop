import type { Order } from "../entities/Order";

export type IOrderRepository = {
  /** The current user's orders, newest first. */
  getOrders(): Promise<Order[]>;
}
