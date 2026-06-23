import type { DeliveryOption } from "../entities/DeliveryOption";

export interface IDeliveryOptionRepository {
  getAll(): Promise<DeliveryOption[]>;
}
