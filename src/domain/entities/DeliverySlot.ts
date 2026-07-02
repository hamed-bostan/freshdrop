/**
 * At or below this many units left (but above 0), the picker nudges with "only N
 * left". Mirrors {@link import("./stock").LOW_STOCK_THRESHOLD} for products — a
 * scarcity nudge, not a live capacity readout.
 */
export const LOW_SLOT_THRESHOLD = 3;

/**
 * How much of a slot is left to book — the three states the picker renders. Only
 * `low` carries a number: when there's plenty (`open`) the exact remaining capacity
 * is deliberately *not* disclosed to the client (no "20 left" noise, no leaking of
 * capacity figures), exactly like the product stock model's three states.
 */
export type SlotAvailability =
  /** Fully booked — the option is disabled and shows "Full". */
  | { level: "full" }
  /** Running low (1…LOW_SLOT_THRESHOLD) — bookable, surfaced with an "only N left" nudge. */
  | { level: "low"; remaining: number }
  /** Comfortable capacity — bookable, no messaging. */
  | { level: "open" };

/** Classify units-left into a slot availability state. Mirrors `getStockStatus`. */
export function getSlotAvailability(remaining: number): SlotAvailability {
  if (!(remaining > 0)) return { level: "full" };
  if (remaining <= LOW_SLOT_THRESHOLD) return { level: "low", remaining };
  return { level: "open" };
}

/**
 * A {@link DeliveryWindow} materialized on a specific calendar date, with its live
 * availability — the unit the checkout screen renders and the shopper books. The
 * `availability` state is computed by the use-case from the window's capacity minus
 * the orders already booked into that (date, window).
 */
export type DeliverySlot = {
  /** The window this slot is an instance of. */
  windowId: string;
  label: string;
  /** Display range, e.g. "8:00 – 10:00 AM". */
  timeRange: string;
  /** How much is left to book — see {@link SlotAvailability}. */
  availability: SlotAvailability;
};

/**
 * One bookable day in the delivery horizon: its calendar date plus a
 * presentation-ready relative label and the day's windows. The label is computed
 * server-side (relative to the store's "now") so the client stays free of date
 * math and there's no server/client hydration drift.
 */
export type DeliverySlotDay = {
  /** Calendar date, `YYYY-MM-DD` (store-local) — free of timezone drift. */
  date: string;
  /** Relative label: "Today" | "Tomorrow" | "Fri, Jul 4". */
  label: string;
  slots: DeliverySlot[];
};
