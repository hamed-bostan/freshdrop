import type { Locale } from "@/src/i18n/routing";
import type { Order } from "@/src/domain/entities/Order";

// The order carries the booked slot as machine refs (`deliveryDate` + `deliveryWindowId`)
// alongside an English display snapshot (`deliveryWindow`) composed at purchase time in
// the locale-free domain. English shows that snapshot as-is; under `fa` we re-derive a
// localized label from the refs (Jalali date + Persian-numeral 24-hour range), since the
// domain can't produce a Persian snapshot.
//
// The window time ranges are a fixed operational catalog (mirroring the seeded
// `delivery_windows` rows) — reference data "like payment methods", per the DeliveryWindow
// entity — so, as with the payment-method label mapping, the presentation owns this small
// lookup rather than fetching the catalog to render one order row.
const WINDOW_MINUTES: Record<string, { start: number; end: number }> = {
  morning: { start: 480, end: 600 },
  midday: { start: 720, end: 840 },
  afternoon: { start: 960, end: 1080 },
  evening: { start: 1080, end: 1200 },
};

// Jalali date + Persian numerals for `fa`; fixed UTC time zone → deterministic on server
// and client (no hydration mismatch). Built once and reused.
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

/** Format minutes-from-midnight as a Persian-numeral time on a fixed UTC anchor. */
function faTime(minutes: number): string {
  return faTimeFormatter.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));
}

/**
 * The order's delivery-slot label for display, localized. English returns the stored
 * snapshot unchanged; `fa` re-derives "‹Jalali date› · ‹۱۸:۰۰ – ۲۰:۰۰›" from the machine
 * refs, falling back to the stored snapshot when they're missing (legacy orders) or the
 * window id is unknown. Returns `undefined` when the order has no delivery slot at all.
 */
export function formatDeliveryWindow(order: Order, locale: Locale): string | undefined {
  if (locale !== "fa") return order.deliveryWindow;

  const window = order.deliveryWindowId ? WINDOW_MINUTES[order.deliveryWindowId] : undefined;
  if (!order.deliveryDate || !window) return order.deliveryWindow;

  const day = faDateFormatter.format(new Date(`${order.deliveryDate}T00:00:00Z`));
  return `${day} · ${faTime(window.start)} – ${faTime(window.end)}`;
}
