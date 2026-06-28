import type { DeliveryOption } from "../entities/DeliveryOption";

export type IDeliveryOptionRepository = {
  getAll(): Promise<DeliveryOption[]>;
}
