import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type {
  IDeliveryLocationRepository,
  NewDeliveryLocation,
} from "../../repositories/IDeliveryLocationRepository";

/**
 * Save a new delivery address for a user. The owner (`userId`) comes from the
 * signed-in session — never trusted from the client — and the address fields come
 * from the validated add-address form.
 */
export class CreateDeliveryLocation {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  execute(userId: string, input: NewDeliveryLocation): Promise<DeliveryLocation> {
    return this.deliveryLocationRepo.create(userId, input);
  }
}
