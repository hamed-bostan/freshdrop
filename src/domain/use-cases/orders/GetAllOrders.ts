import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";

/** Every order across users — the admin dashboard read. Gate the caller to admins. */
export class GetAllOrders {
  constructor(private readonly orderRepo: IOrderRepository) {}

  execute(): Promise<Order[]> {
    return this.orderRepo.getAllOrders();
  }
}
