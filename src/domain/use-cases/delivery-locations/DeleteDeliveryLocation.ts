import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Delete an existing delivery address for a user. Both the ownership check and the
 * delete are scoped to the signed-in `userId` — never trusted from the client — so
 * a user can only remove their own addresses. An unknown (or someone else's) id
 * surfaces as a NotFoundError → 404.
 */
export class DeleteDeliveryLocation {
  constructor(private readonly deliveryLocationRepo: IDeliveryLocationRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const existing = await this.deliveryLocationRepo.getById(userId, id);
    if (!existing) throw new NotFoundError("address", id);

    await this.deliveryLocationRepo.remove(userId, id);
  }
}
