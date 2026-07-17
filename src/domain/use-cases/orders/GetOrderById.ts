import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";

/**
 * A single order by id, across users — the admin dashboard's order-detail read.
 * Returns `null` when no order matches (the route maps that to 404). Gate the
 * caller to admins; unlike the storefront read this isn't scoped to an owner.
 */
export class GetOrderById {
  constructor(private readonly orderRepo: IOrderRepository) {}

  execute(orderId: string): Promise<Order | null> {
    return this.orderRepo.getById(orderId);
  }
}
