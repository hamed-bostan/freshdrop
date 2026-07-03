import type { DeliveryLocation } from "../entities/DeliveryLocation";

/** A new address to persist. The id is assigned by the repository; the owner is the userId argument. */
export type NewDeliveryLocation = Omit<DeliveryLocation, "id">;

export type IDeliveryLocationRepository = {
  getByUser(userId: string): Promise<DeliveryLocation[]>;
  /** One of the user's addresses by id, scoped to the owner; `null` when it isn't theirs or doesn't exist. */
  getById(userId: string, id: string): Promise<DeliveryLocation | null>;
  create(userId: string, input: NewDeliveryLocation): Promise<DeliveryLocation>;
  /** Overwrite an existing address the user owns; the write is scoped to the owner. */
  update(userId: string, id: string, input: NewDeliveryLocation): Promise<DeliveryLocation>;
  /** Delete an existing address the user owns; the delete is scoped to the owner. */
  remove(userId: string, id: string): Promise<void>;
}
