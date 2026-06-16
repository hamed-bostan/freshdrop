import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";

export class GetDeliveryLocations {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  execute(): Promise<DeliveryLocation[]> {
    return this.deliveryLocationRepo.getAll();
  }
}
