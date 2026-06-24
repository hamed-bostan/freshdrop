import type { OrderTracking } from "../../entities/OrderTracking";
import type { IOrderTrackingRepository } from "../../repositories/IOrderTrackingRepository";

export class GetOrderTracking {
  constructor(private readonly trackingRepo: IOrderTrackingRepository) {}

  execute(orderId: string): Promise<OrderTracking | null> {
    return this.trackingRepo.getByOrderId(orderId);
  }
}
