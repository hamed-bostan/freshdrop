import type { DeliveryLocation } from "../entities/DeliveryLocation";

export interface IDeliveryLocationRepository {
  getAll(): Promise<DeliveryLocation[]>;
}
