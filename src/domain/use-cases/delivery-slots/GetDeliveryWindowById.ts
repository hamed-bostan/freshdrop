import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";

/** One window from the catalog, to prefill the admin edit form; `null` when it's gone. */
export class GetDeliveryWindowById {
  constructor(private readonly slotRepo: IDeliverySlotRepository) {}

  execute(id: string): Promise<DeliveryWindow | null> {
    return this.slotRepo.getWindow(id);
  }
}
