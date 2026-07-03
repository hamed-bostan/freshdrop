import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";

/**
 * Fetch one of a user's saved addresses by id. Scoped to the owner (`userId`
 * comes from the session): another user's id resolves to `null`, so it reads the
 * same as "not found" — a caller can't probe for others' addresses.
 */
export class GetDeliveryLocation {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  execute(userId: string, id: string): Promise<DeliveryLocation | null> {
    return this.deliveryLocationRepo.getById(userId, id);
  }
}
