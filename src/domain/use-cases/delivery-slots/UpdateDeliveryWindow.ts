import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import type { DeliveryWindowInput, IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { assertValidDeliveryWindow } from "./deliveryWindowRules";

/**
 * Edit a delivery window's hours, capacity or display order. The id is not
 * editable — the booking ledger and every order that booked this window reference
 * it by slug.
 *
 * Capacity may be lowered below what's already booked on some date, and that's
 * allowed on purpose: those orders are real and stay booked. The affected days
 * simply read as full until the bookings pass, which is exactly what an operator
 * cutting capacity is asking for — the alternative would be refusing to reduce
 * capacity for a week because one day is busy.
 */
export class UpdateDeliveryWindow {
  constructor(private readonly slotRepo: IDeliverySlotRepository) {}

  async execute(id: string, input: DeliveryWindowInput): Promise<DeliveryWindow> {
    if (!id) throw new ValidationError("id", "Missing delivery window id.");

    const window: DeliveryWindowInput = { ...input, label: input.label.trim() };
    assertValidDeliveryWindow(window);

    const existing = await this.slotRepo.getWindow(id);
    if (!existing) throw new NotFoundError("delivery window", id);

    return this.slotRepo.updateWindow(id, window);
  }
}
