import type { Locale } from "@/src/i18n/routing";

// Deterministic, locale-aware order date/time formatting. A fixed UTC time zone
// keeps output identical on the server and its client hydration (no mismatch).
// Under `fa` the Persian (Jalali) calendar and Persian numerals come from the
// `fa-IR-u-ca-persian` BCP-47 tag — `Intl` does the Gregorian→Jalali conversion
// natively, so no extra date library is needed. `en` stays Gregorian/Latin.

// App locale → BCP-47 tag selecting its calendar + numbering system.
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fa: "fa-IR-u-ca-persian",
};

type OrderFormatters = {
  weekday: Intl.DateTimeFormat;
  month: Intl.DateTimeFormat;
  day: Intl.DateTimeFormat;
  year: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
};

// Formatters are relatively costly to build, so cache one set per locale.
const cache = new Map<Locale, OrderFormatters>();

function getFormatters(locale: Locale): OrderFormatters {
  const cached = cache.get(locale);
  if (cached) return cached;

  const tag = INTL_LOCALE[locale];
  const formatters: OrderFormatters = {
    weekday: new Intl.DateTimeFormat(tag, { weekday: "long", timeZone: "UTC" }),
    month: new Intl.DateTimeFormat(tag, { month: "long", timeZone: "UTC" }),
    day: new Intl.DateTimeFormat(tag, { day: "numeric", timeZone: "UTC" }),
    year: new Intl.DateTimeFormat(tag, { year: "numeric", timeZone: "UTC" }),
    time: new Intl.DateTimeFormat(tag, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }),
  };
  cache.set(locale, formatters);
  return formatters;
}

/** "03:22 PM" (en) — Persian numerals + Jalali day period under `fa`. */
export function formatOrderTime(iso: string, locale: Locale): string {
  return getFormatters(locale).time.format(new Date(iso));
}

/** "Monday - October 9,2023" (en) — Jalali calendar + Persian numerals under `fa`. */
export function formatOrderDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const f = getFormatters(locale);
  return `${f.weekday.format(date)} - ${f.month.format(date)} ${f.day.format(date)},${f.year.format(date)}`;
}
