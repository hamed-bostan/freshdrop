import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";

import type { SlotSelection } from "./components/DeliverySlotPicker";

export const SLOT_STORAGE_KEY = "freshdrop:checkout:slot";
export const SUBSTITUTIONS_STORAGE_KEY = "freshdrop:checkout:substitutions";
export const NOTES_STORAGE_KEY = "freshdrop:checkout:notes";

export function firstBookableSlot(days: DeliverySlotDay[]): SlotSelection | null {
  for (const day of days) {
    const slot = day.slots.find((candidate) => candidate.availability.level !== "full");
    if (slot) return { date: day.date, windowId: slot.windowId };
  }
  return null;
}

export function reviveSlot(days: DeliverySlotDay[], fallback: SlotSelection | null, stored: SlotSelection | null): SlotSelection | null {
  if (!stored || typeof stored.date !== "string" || typeof stored.windowId !== "string") return fallback;
  const slot = days.find((day) => day.date === stored.date)?.slots.find((candidate) => candidate.windowId === stored.windowId);
  return slot && slot.availability.level !== "full" ? stored : fallback;
}

export function reviveSubstitutions(stored: Record<string, SubstitutionPreference>): Record<string, SubstitutionPreference> {
  if (typeof stored !== "object" || stored === null) return {};
  const clean: Record<string, SubstitutionPreference> = {};
  for (const [productId, preference] of Object.entries(stored)) {
    if (preference === "substitute" || preference === "refund" || preference === "contact") clean[productId] = preference;
  }
  return clean;
}

export function checkoutItemsHref(promoCode?: string): string {
  return promoCode ? `/cart/checkout/items?promo=${encodeURIComponent(promoCode)}` : "/cart/checkout/items";
}

export function checkoutReviewHref(promoCode?: string): string {
  return promoCode ? `/cart/checkout?step=review&promo=${encodeURIComponent(promoCode)}` : "/cart/checkout?step=review";
}

export function maskPhone(phone: string): string {
  const normalized = phone.replace(/\s+/g, "");
  if (normalized.length <= 6) return normalized;
  const firstGroupLength = normalized.startsWith("+") ? 3 : 2;
  const first = normalized.slice(0, firstGroupLength);
  const second = normalized.slice(firstGroupLength, firstGroupLength + 3);
  const hidden = "*".repeat(Math.max(3, normalized.length - firstGroupLength - second.length - 2));
  return `${first} ${second} ${hidden} ${normalized.slice(-2)}`;
}

export function walletAmounts(balance: number, total: number, enabled: boolean): { applied: number; remainder: number } {
  const cents = (amount: number) => Math.round(Math.max(amount, 0) * 100);
  const totalCents = cents(total);
  const appliedCents = enabled ? Math.min(cents(balance), totalCents) : 0;
  return { applied: appliedCents / 100, remainder: (totalCents - appliedCents) / 100 };
}
