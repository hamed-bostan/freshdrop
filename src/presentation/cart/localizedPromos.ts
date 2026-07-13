/**
 * Promo codes whose title/description have localized copy under `checkout.promos`.
 * Promos are DB-backed, so the presentation layer owns this mapping (same pattern
 * as the category filter): a code outside this list — e.g. one added to the
 * catalog later — falls back to the stored copy, so it still renders, just in the
 * original language. Kept in one place so the list can't drift between the promo
 * list and the applied-promo bar.
 */
export const LOCALIZED_PROMO_CODES = ["SNAPP15", "FRESH10", "GREENS20", "SAVE5"] as const;

export type LocalizedPromoCode = (typeof LOCALIZED_PROMO_CODES)[number];

/** Narrows a stored promo code to one we have localized copy for. */
export function isLocalizedPromo(code: string): code is LocalizedPromoCode {
  return (LOCALIZED_PROMO_CODES as readonly string[]).includes(code);
}
