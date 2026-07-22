import type { Locale } from "@/src/i18n/routing";
import type { AnalyticsGranularity } from "@/src/domain/entities/Analytics";

// Compact, deterministic date labels for the analytics surfaces — chart axis ticks
// and the "which days am I looking at" caption under the period picker.
//
// Same rules as `formatOrderDate`: a fixed UTC time zone so server and client
// hydration agree, and `fa-IR-u-ca-persian` so Persian gets the Jalali calendar and
// Persian numerals from `Intl` natively. UTC is also what the aggregates bucket by
// (see `PrismaAnalyticsRepository`), so a tick labelled "Jul 3" names exactly the
// bucket the query produced rather than the reader's local version of that day.
//
// Separate from `formatOrderDate` because the job is different: that one spells a
// date out for a receipt ("Monday", "July", "3"), this one has to fit under a bar.

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fa: "fa-IR-u-ca-persian",
};

const cache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: Locale, options: Intl.DateTimeFormatOptions, key: string): Intl.DateTimeFormat {
  const cacheKey = `${locale}:${key}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: "UTC", ...options });
  cache.set(cacheKey, formatter);
  return formatter;
}

/** A day, as short as it can be and still unambiguous within a period — "Jul 3". */
export function formatShortDate(iso: string, locale: Locale): string {
  return getFormatter(locale, { month: "short", day: "numeric" }, "shortDate").format(new Date(iso));
}

/** A day including its year — for captions naming a period's bounds. */
export function formatMediumDate(iso: string, locale: Locale): string {
  return getFormatter(
    locale,
    { year: "numeric", month: "short", day: "numeric" },
    "mediumDate",
  ).format(new Date(iso));
}

/**
 * A time-series bucket's label. Monthly buckets drop the day — "Jul 1" under a bar
 * covering all of July is worse than no label, because it reads as a single day.
 */
export function formatBucketLabel(
  iso: string,
  granularity: AnalyticsGranularity,
  locale: Locale,
): string {
  if (granularity === "month") {
    return getFormatter(locale, { year: "2-digit", month: "short" }, "monthLabel").format(new Date(iso));
  }
  return formatShortDate(iso, locale);
}
