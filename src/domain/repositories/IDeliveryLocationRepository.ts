import type { DeliveryLocation } from "../entities/DeliveryLocation";

/** A new address to persist. The id is assigned by the repository; the owner is the userId argument. */
export type NewDeliveryLocation = Omit<DeliveryLocation, "id">;

export type IDeliveryLocationRepository = {
  getByUser(userId: string): Promise<DeliveryLocation[]>;
  create(userId: string, input: NewDeliveryLocation): Promise<DeliveryLocation>;
}
