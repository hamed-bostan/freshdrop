/**
 * A recurring delivery time-of-day window the storefront offers (e.g. "Morning,
 * 8:00 – 10:00 AM"). Reference/catalog data — not user data — like payment
 * methods: a fixed, ordered list, seeded and read at checkout.
 *
 * Times are stored as minutes-from-midnight (store-local) rather than a display
 * string: the number is what the same-day cutoff check compares against, and the
 * display string is derived from it via {@link formatWindowRange}. `capacity` is
 * the maximum number of orders that may be booked into this window on any single
 * date — the ceiling the per-slot booking counter is guarded against.
 */
export type DeliveryWindow = {
  /** Stable human slug (e.g. "morning"), so the seed and orders reference it. */
  id: string;
  label: string;
  /** Window start, minutes from midnight (e.g. 480 = 08:00). */
  startMinutes: number;
  /** Window end, minutes from midnight (e.g. 600 = 10:00). */
  endMinutes: number;
  /** Max orders bookable into this window per date. */
  capacity: number;
  /** Fixes the display order at checkout. */
  position: number;
};

const minuteFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** Format one endpoint (minutes from midnight) as a 12-hour clock time via a fixed UTC formatter. */
function formatMinutes(minutes: number): string {
  // Anchor to an arbitrary UTC date; only the time-of-day is formatted.
  return minuteFormatter.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));
}

/**
 * A human range for a window, e.g. `"8:00 – 10:00 AM"`. Pure and deterministic
 * (fixed UTC formatter), so it renders identically on server and client.
 */
export function formatWindowRange(startMinutes: number, endMinutes: number): string {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}
