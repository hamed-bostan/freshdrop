import { localizeOrderItems } from "./localizeOrderItems";

import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetOrders {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(userId: string, locale?: string): Promise<Order[]> {
    const orders = await this.orderRepo.getOrders(userId);
    // Re-resolve line-item names to the reader's locale (snapshot as fallback), so
    // order history reads in the active language without touching the price record.
    return localizeOrderItems(orders, this.productRepo, locale);
  }
}
