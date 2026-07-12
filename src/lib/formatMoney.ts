import type { Locale } from "@/src/i18n/routing";
import { USD_TO_TOMAN } from "@/src/config/currency";

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

/** Format a stored USD amount for display in the given locale. */
export function formatMoney(amountUsd: number, locale: Locale): string {
  if (locale === "fa") {
    const toman = Math.round(amountUsd * USD_TO_TOMAN);
    return `${tomanFormatter.format(toman)} تومان`;
  }

  return usdFormatter.format(amountUsd);
}
