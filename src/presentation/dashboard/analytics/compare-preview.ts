import { previousPeriod, previousYearRange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { toExclusiveDateRange, toInclusiveParams, type ComparisonMode } from "@/src/lib/api/analytics-params";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";

/**
 * No `"use client"` here, deliberately: `ReportHeader` and `PaymentSummaryScreen`
 * call {@link resolveComparePreviews} from server components, and a function
 * exported from a client module can only be *rendered* across that boundary
 * (as a Component, or passed down as a prop) — calling it directly, the way a
 * plain helper is called, throws at runtime. Pure computation shared by both a
 * server caller and `AnalyticsComparePicker` (the client component that also
 * needs {@link CompareOption}) therefore lives in its own boundary-free module.
 */

/** One radio row's copy — label and preview, both already resolved for the active locale. */
export type CompareOption = { value: ComparisonMode; label: string; subtitle: string };

/** One baseline's inclusive `YYYY-MM-DD` bounds, each already formatted for display. */
export type ComparePreview = { from: string; to: string; formattedFrom: string; formattedTo: string };

/**
 * The "Previous period"/"Previous year" baselines a report's own period
 * resolves to — the arithmetic (`previousPeriod`/`previousYearRange`) and
 * locale-formatting every caller needs to build the compare panel's option
 * list, factored out so `ReportHeader` and `PaymentSummaryScreen` (the one
 * report that renders its own header rather than delegating to
 * `ReportHeader`) share one computation instead of each repeating it.
 *
 * Returns bounds rather than a finished sentence: joining `formattedFrom`/
 * `formattedTo` into "{from} – {to}" is a translation's job (`rangeCaption`),
 * not this function's, the same way `ReportHeader` already resolves
 * `AnalyticsRangePicker`'s preset labels itself rather than asking a helper
 * to know about `next-intl`.
 */
export function resolveComparePreviews(rangeFrom: string, rangeTo: string, locale: Locale): { previous: ComparePreview; previousYear: ComparePreview } {
  const mainRange = toExclusiveDateRange(rangeFrom, rangeTo);
  const previous = toInclusiveParams(previousPeriod(mainRange));
  const previousYear = toInclusiveParams(previousYearRange(mainRange));
  return {
    previous: { ...previous, formattedFrom: formatMediumDate(previous.from, locale), formattedTo: formatMediumDate(previous.to, locale) },
    previousYear: { ...previousYear, formattedFrom: formatMediumDate(previousYear.from, locale), formattedTo: formatMediumDate(previousYear.to, locale) },
  };
}
