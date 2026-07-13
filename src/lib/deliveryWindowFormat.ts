// Persian (Jalali + Persian-numeral) formatting for the fixed delivery-window catalog,
// shared by the checkout slot picker and the order delivery-window snapshot. The domain
// is locale-free, so `fa` labels are re-derived here in presentation from the machine
// refs (window id + date), exactly as the payment-method labels are mapped by id.
//
// The window time ranges mirror the seeded `delivery_windows` rows — reference data
// "like payment methods" — so the presentation owns this small lookup rather than
// fetching the catalog to render one row. All formatters pin a fixed UTC time zone so
// output is identical on the server and its client hydration (no mismatch).

/** Stable window slug → its minutes-from-midnight range. Mirrors the seeded catalog. */
export const WINDOW_MINUTES: Record<string, { start: number; end: number }> = {
  morning: { start: 480, end: 600 },
  midday: { start: 720, end: 840 },
  afternoon: { start: 960, end: 1080 },
  evening: { start: 1080, end: 1200 },
};

const faDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const faTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Persian-numeral 24-hour clock for a minutes-from-midnight value, on a fixed UTC anchor. */
export function faWindowTime(minutes: number): string {
  return faTimeFormatter.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));
}

/** Persian-numeral 24-hour range for a window id (e.g. "۰۸:۰۰ – ۱۰:۰۰"); `undefined` for an unknown id. */
export function faWindowRange(windowId: string): string | undefined {
  const window = WINDOW_MINUTES[windowId];
  return window ? `${faWindowTime(window.start)} – ${faWindowTime(window.end)}` : undefined;
}

/** Jalali long date (weekday day month, Persian numerals) for a `YYYY-MM-DD` store-local date. */
export function faJalaliDate(date: string): string {
  return faDateFormatter.format(new Date(`${date}T00:00:00Z`));
}
