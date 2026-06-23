import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";

export class GetOrders {
  constructor(private readonly orderRepo: IOrderRepository) {}

  execute(): Promise<Order[]> {
    return this.orderRepo.getOrders();
  }
}
