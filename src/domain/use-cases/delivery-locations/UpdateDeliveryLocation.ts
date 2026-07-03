import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type {
  IDeliveryLocationRepository,
  NewDeliveryLocation,
} from "../../repositories/IDeliveryLocationRepository";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Overwrite an existing delivery address for a user. Both the ownership check and
 * the write are scoped to the signed-in `userId` — never trusted from the client —
 * so a user can only edit their own addresses. An unknown (or someone else's) id
 * surfaces as a NotFoundError → 404.
 */
export class UpdateDeliveryLocation {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  async execute(userId: string, id: string, input: NewDeliveryLocation): Promise<DeliveryLocation> {
    const existing = await this.deliveryLocationRepo.getById(userId, id);
    if (!existing) throw new NotFoundError("address", id);

    return this.deliveryLocationRepo.update(userId, id, input);
  }
}
