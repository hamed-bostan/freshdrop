import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";

export class GetDeliveryLocations {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  execute(userId: string): Promise<DeliveryLocation[]> {
    return this.deliveryLocationRepo.getByUser(userId);
  }
}
