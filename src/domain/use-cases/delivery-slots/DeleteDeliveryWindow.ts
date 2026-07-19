import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ResourceInUseError } from "../../errors/ResourceInUseError";

/**
 * Remove a delivery window from the catalog — refused while orders are still
 * booked into it today or later.
 *
 * The guard is the point: an order snapshots its window as a display string but
 * references it by slug, and the booking ledger is keyed by (date, slug). Deleting
 * a window someone is waiting on leaves that customer holding a delivery time the
 * store no longer offers, and leaves ledger rows counting against a window that
 * isn't there. Past bookings don't block anything — those deliveries have happened.
 *
 * An operator who wants a busy window gone anyway has the sequence they'd want:
 * cut its capacity so nothing new books it, then remove it once the last booked
 * day passes.
 */
export class DeleteDeliveryWindow {
  constructor(private readonly slotRepo: IDeliverySlotRepository) {}

  async execute(id: string, now: Date = new Date()): Promise<void> {
    const existing = await this.slotRepo.getWindow(id);
    if (!existing) throw new NotFoundError("delivery window", id);

    // Today counts as upcoming: a delivery booked for this morning is still a
    // commitment until the day is over.
    const today = now.toISOString().slice(0, 10);
    const upcoming = await this.slotRepo.countBookingsFrom(id, today);
    if (upcoming > 0) {
      throw new ResourceInUseError(
        "delivery window",
        `${existing.label} still has ${upcoming} upcoming ${upcoming === 1 ? "booking" : "bookings"}. Reduce its capacity to stop new bookings, then remove it once those deliveries are done.`,
      );
    }

    await this.slotRepo.deleteWindow(id);
  }
}
