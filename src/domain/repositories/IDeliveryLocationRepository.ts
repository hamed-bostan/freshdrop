import type { DeliveryLocation } from "../entities/DeliveryLocation";

export type IDeliveryLocationRepository = {
  getAll(): Promise<DeliveryLocation[]>;
}
