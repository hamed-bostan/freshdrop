import type { Locale } from "@/src/i18n/routing";
import type { Order } from "@/src/domain/entities/Order";
import { WINDOW_MINUTES, faJalaliDate, faWindowTime } from "./deliveryWindowFormat";

// The order carries the booked slot as machine refs (`deliveryDate` + `deliveryWindowId`)
// alongside an English display snapshot (`deliveryWindow`) composed at purchase time in
// the locale-free domain. English shows that snapshot as-is; under `fa` we re-derive a
// localized label from the refs (Jalali date + Persian-numeral 24-hour range) via the
// shared window catalog, since the domain can't produce a Persian snapshot.

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

  return `${faJalaliDate(order.deliveryDate)} · ${faWindowTime(window.start)} – ${faWindowTime(window.end)}`;
}
