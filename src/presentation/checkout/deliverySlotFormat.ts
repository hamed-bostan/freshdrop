import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { faJalaliDate, faWindowRange } from "@/src/lib/deliveryWindowFormat";

/** Window ids with a localized name under `checkout.slots`; others fall back to the stored name. */
export const SLOT_NAME_KEYS = ["morning", "midday", "afternoon", "evening"] as const;
export type SlotNameKey = (typeof SLOT_NAME_KEYS)[number];

export const isSlotNameKey = (windowId: string): windowId is SlotNameKey =>
  (SLOT_NAME_KEYS as readonly string[]).includes(windowId);

/**
 * A bookable day's display label. English shows the domain's snapshot as-is;
 * `fa` localizes the relative label and re-derives dated days as a Jalali date
 * (the today/tomorrow standing is decided server-side, so no store-relative
 * date math runs on the client). Shared by the slot picker and the review
 * step's read-only delivery summary, so both localize identically.
 */
export function slotDayLabel(
  day: DeliverySlotDay,
  locale: string,
  t: { (key: "today"): string; (key: "tomorrow"): string },
): string {
  if (locale !== "fa") return day.label;
  if (day.relativeDay === "today") return t("today");
  if (day.relativeDay === "tomorrow") return t("tomorrow");
  return faJalaliDate(day.date);
}

/** A window's display name from the localized catalog; an unknown id falls back to the stored name. */
export function slotName(windowId: string, label: string, tSlots: (key: SlotNameKey) => string): string {
  return isSlotNameKey(windowId) ? tSlots(windowId) : label;
}

/** A window's display time range. English keeps the domain's snapshot; `fa` re-derives a Persian-numeral 24h range. */
export function slotTimeRange(windowId: string, timeRange: string, locale: string): string {
  return locale === "fa" ? (faWindowRange(windowId) ?? timeRange) : timeRange;
}
