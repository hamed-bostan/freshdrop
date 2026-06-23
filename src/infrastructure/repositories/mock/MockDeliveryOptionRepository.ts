import type { DeliveryOption } from "@/src/domain/entities/DeliveryOption";
import type { IDeliveryOptionRepository } from "@/src/domain/repositories/IDeliveryOptionRepository";

const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "fast", label: "Fast Delivery", eta: "45 - 60 Min" },
  { id: "standard", label: "Standard Delivery", eta: "2 - 3 Hours" },
];

export class MockDeliveryOptionRepository implements IDeliveryOptionRepository {
  async getAll(): Promise<DeliveryOption[]> {
    return DELIVERY_OPTIONS;
  }
}
