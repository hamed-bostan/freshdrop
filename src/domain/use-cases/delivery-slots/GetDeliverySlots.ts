import type { DeliverySlot, DeliverySlotDay } from "../../entities/DeliverySlot";
import { getSlotAvailability } from "../../entities/DeliverySlot";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import {
  bookedCountKey,
  type IDeliverySlotRepository,
} from "../../repositories/IDeliverySlotRepository";

/** How many days ahead (including today) the storefront offers booking for. */
export const SLOT_HORIZON_DAYS = 7;

/**
 * How far ahead of a same-day window's start we stop offering it, in minutes — the
 * order still needs to be picked and dispatched. A window starting sooner than this
 * from "now" is dropped from today's list.
 */
export const SLOT_CUTOFF_MINUTES = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

// Fixed UTC formatter for the "Fri, Jul 4" label on days beyond tomorrow —
// deterministic (server === client), like the order-date formatters.
const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * The bookable delivery slots for the next {@link SLOT_HORIZON_DAYS} days, grouped
 * by day with live availability. Availability is the window's capacity minus the
 * orders already booked into that (date, window); a same-day window whose start is
 * within {@link SLOT_CUTOFF_MINUTES} of now is dropped (too late to fulfil), and a
 * day with no remaining bookable windows is omitted entirely.
 *
 * All date math is done in UTC so the calendar dates and relative labels are
 * deterministic and match the app's other UTC-based formatting.
 */
export class GetDeliverySlots {
  constructor(private readonly slotRepo: IDeliverySlotRepository) {}

  async execute(now: Date = new Date()): Promise<DeliverySlotDay[]> {
    const windows = await this.slotRepo.listWindows();

    // Midnight UTC today, then one entry per horizon day.
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dates = Array.from({ length: SLOT_HORIZON_DAYS }, (_, i) =>
      new Date(startOfToday + i * DAY_MS).toISOString().slice(0, 10),
    );
    const booked = await this.slotRepo.getBookedCounts(dates);

    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const days: DeliverySlotDay[] = [];
    dates.forEach((date, dayIndex) => {
      const isToday = dayIndex === 0;

      const slots: DeliverySlot[] = [];
      for (const window of windows) {
        // Today's windows too close to (or past) their start are no longer offered.
        if (isToday && window.startMinutes - nowMinutes < SLOT_CUTOFF_MINUTES) continue;

        const used = booked[bookedCountKey(date, window.id)] ?? 0;
        const remaining = Math.max(0, window.capacity - used);
        slots.push({
          windowId: window.id,
          label: window.label,
          timeRange: formatWindowRange(window.startMinutes, window.endMinutes),
          availability: getSlotAvailability(remaining),
        });
      }

      if (slots.length === 0) return; // nothing bookable this day — omit the pill

      days.push({ date, label: dayLabel(dayIndex, date), slots });
    });

    return days;
  }
}

/** Relative day label: "Today" / "Tomorrow" / "Fri, Jul 4". */
function dayLabel(dayIndex: number, date: string): string {
  if (dayIndex === 0) return "Today";
  if (dayIndex === 1) return "Tomorrow";
  return dayLabelFormatter.format(new Date(`${date}T00:00:00Z`));
}
