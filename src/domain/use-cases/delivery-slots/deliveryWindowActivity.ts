import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import type { DeliveryWindowInput } from "../../repositories/IDeliverySlotRepository";

/**
 * The fields of a delivery window the activity log tracks, flattened for diffing.
 *
 * `capacity` is the one that matters most and the reason this is instrumented at
 * all: lowering it is how an operator stops new bookings, it silently makes days
 * read as full, and `UpdateDeliveryWindow` deliberately allows cutting it below
 * what's already booked. "Who dropped Saturday morning to 2, and from what" is a
 * question that will be asked.
 *
 * The hours are recorded as a formatted range rather than as two minute counts:
 * `startMinutes: 480 → 540` is arithmetic the reader has to do, and a log that
 * needs mental arithmetic to read is a log that gets read wrong. One `hours` field
 * moving from "8:00 AM – 10:00 AM" to "9:00 AM – 10:00 AM" says it outright.
 */
export function deliveryWindowSnapshot(
  window: DeliveryWindow | DeliveryWindowInput,
): Record<string, unknown> {
  return {
    label: window.label,
    hours: formatWindowRange(window.startMinutes, window.endMinutes),
    capacity: window.capacity,
    position: window.position,
  };
}
