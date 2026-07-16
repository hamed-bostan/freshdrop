import type { Locale } from "@/src/i18n/routing";
import { getUsdToToman } from "@/src/config/currency";

// Single source of truth for presenting a stored USD amount per locale:
//   • en → US dollars via `Intl` ("$4.50")
//   • fa → converted to Toman, grouped with Persian numerals + "تومان" ("۴۰۵٬۰۰۰ تومان")
//
// Pure and locale-parameterized: the impure "what is the active locale" question
// is answered in presentation (next-intl `useLocale`/`getLocale`) and passed in,
// so this stays a framework-free helper (Clean Architecture — `lib` never reaches
// into request state). Formatters are module-level singletons; the locale is
// stable across a server render and its client hydration, so output is identical
// on both sides (no hydration mismatch).

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Toman is quoted as a whole number in everyday use (no subunit). `fa-IR` yields
// Persian digits and the Persian grouping separator; the "تومان" label is appended
// separately so the numeral formatting stays a plain grouped integer.
const tomanFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

/** A stored USD amount as whole Toman — the exact number `fa` renders for it. */
function usdToToman(amountUsd: number): number {
  return Math.round(amountUsd * getUsdToToman());
}

/** Format a whole-Toman amount with Persian numerals and the تومان label. */
function formatToman(toman: number): string {
  return `${tomanFormatter.format(toman)} تومان`;
}

/** Format a stored USD amount for display in the given locale. */
export function formatMoney(amountUsd: number, locale: Locale): string {
  if (locale === "fa") return formatToman(usdToToman(amountUsd));
  return usdFormatter.format(amountUsd);
}

/**
 * Format the bottom line of a visible breakdown (subtotal + shipping − discount,
 * total − refunds, …), given the breakdown's signed USD parts.
 *
 * Under `fa` every displayed line is independently rounded to whole Toman, so the
 * total is derived from those *rounded* values — the arithmetic a shopper can check
 * on screen always adds up, where converting the exact USD total could drift by a
 * few Toman. Each part contributes exactly what its own line shows: `sign × round(|part|)`
 * (signed rounding would skew ties, since `Math.round` rounds halves up). Under `en`
 * cents are exact, so the parts are simply summed.
 */
export function formatMoneySum(partsUsd: number[], locale: Locale): string {
  if (locale === "fa") {
    const toman = partsUsd.reduce((sum, part) => sum + Math.sign(part) * usdToToman(Math.abs(part)), 0);
    return formatToman(toman);
  }
  return usdFormatter.format(partsUsd.reduce((sum, part) => sum + part, 0));
}
