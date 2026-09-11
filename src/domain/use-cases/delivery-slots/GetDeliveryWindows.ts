import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";

/**
 * The recurring window catalog itself, in display order — what the operator edits.
 *
 * Distinct from {@link import("./GetDeliverySlots").GetDeliverySlots}, which
 * projects these windows across the booking horizon into dated, capacity-checked
 * slots for the shopper. This is the definition; that is the schedule it produces.
 */
export class GetDeliveryWindows {
  constructor(private readonly slotRepo: IDeliverySlotRepository) {}

  execute(): Promise<DeliveryWindow[]> {
    return this.slotRepo.listWindows();
  }
}
