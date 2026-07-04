import type { DeliveryLocation } from "../../entities/DeliveryLocation";
import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Make one of a user's saved addresses their checkout default. Both the ownership
 * check and the write are scoped to the signed-in `userId` — never trusted from the
 * client — so a user can only select their own addresses. An unknown (or someone
 * else's) id surfaces as a NotFoundError → 404. The repository clears the previous
 * default in the same transaction, keeping exactly one default per user.
 */
export class SetDefaultDeliveryLocation {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  async execute(userId: string, id: string): Promise<DeliveryLocation> {
    const existing = await this.deliveryLocationRepo.getById(userId, id);
    if (!existing) throw new NotFoundError("address", id);

    return this.deliveryLocationRepo.setDefault(userId, id);
  }
}
