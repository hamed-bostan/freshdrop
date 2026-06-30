import type { OrderTracking } from "../../entities/OrderTracking";
import type { IOrderTrackingRepository, TrackingViewer } from "../../repositories/IOrderTrackingRepository";

export class GetOrderTracking {
  constructor(private readonly trackingRepo: IOrderTrackingRepository) {}

  execute(orderId: string, viewer: TrackingViewer): Promise<OrderTracking | null> {
    return this.trackingRepo.getByOrderId(orderId, viewer);
  }
}
