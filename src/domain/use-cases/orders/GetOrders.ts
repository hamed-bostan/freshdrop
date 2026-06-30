import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";

export class GetOrders {
  constructor(private readonly orderRepo: IOrderRepository) {}

  execute(userId: string): Promise<Order[]> {
    return this.orderRepo.getOrders(userId);
  }
}
