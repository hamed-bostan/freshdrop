import type { DeliveryOption } from "../../entities/DeliveryOption";
import type { IDeliveryOptionRepository } from "../../repositories/IDeliveryOptionRepository";

export class GetDeliveryOptions {
  constructor(private readonly deliveryOptionRepo: IDeliveryOptionRepository) {}

  execute(): Promise<DeliveryOption[]> {
    return this.deliveryOptionRepo.getAll();
  }
}
