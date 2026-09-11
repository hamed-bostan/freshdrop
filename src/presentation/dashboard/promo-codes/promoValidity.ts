import { isoToEndDate } from "@/src/contracts/promo-code-schema";
import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import type { Locale } from "@/src/i18n/routing";

/**
 * Render a campaign's validity window for the admin table.
 *
 * The stored `endsAt` is the *exclusive* instant the campaign closes (see
 * `endDateToIso`), so it's converted back to the inclusive last day before being
 * shown — an operator who set "runs through Jul 31" must read Jul 31 here, not
 * Aug 1. `isoToEndDate` is that inverse, the same one the edit form refills from.
 *
 * Fixed UTC formatters, so output is identical on the server and its client
 * hydration. Under `fa` dates are Jalali with Persian numerals, matching the rest
 * of the dashboard.
 */

const DATE_TAG: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };

const cache = new Map<Locale, Intl.DateTimeFormat>();

function getFormatter(locale: Locale): Intl.DateTimeFormat {
  const cached = cache.get(locale);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(DATE_TAG[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  cache.set(locale, formatter);
  return formatter;
}

/** Which `dashPromoCodes` message describes this window, and the dates to fill it with. */
export type PromoValidityLabel =
  | { key: "validityAlways"; values?: undefined }
  | { key: "validityFrom"; values: { start: string } }
  | { key: "validityUntil"; values: { end: string } }
  | { key: "validityRange"; values: { start: string; end: string } };

/**
 * Pick the message and dates for a campaign's window. Returns the key rather than
 * formatted copy so the caller translates it — the four shapes ("always on", open
 * start, open end, bounded) each need their own sentence per locale.
 */
export function promoValidityLabel(
  promo: Pick<AdminPromoCode, "startsAt" | "endsAt">,
  locale: Locale,
): PromoValidityLabel {
  const format = getFormatter(locale);
  const start = promo.startsAt ? format.format(new Date(promo.startsAt)) : undefined;
  // Back to the inclusive last day the code works, then formatted.
  const end = promo.endsAt ? format.format(new Date(`${isoToEndDate(promo.endsAt)}T00:00:00Z`)) : undefined;

  if (start && end) return { key: "validityRange", values: { start, end } };
  if (start) return { key: "validityFrom", values: { start } };
  if (end) return { key: "validityUntil", values: { end } };
  return { key: "validityAlways" };
}
