import { getLocale, getTranslations } from "next-intl/server";
import type { AnalyticsGranularity, RevenuePoint } from "@/src/domain/entities/Analytics";
import { getLangDir } from "@/src/i18n/direction";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { RevenueChartBars } from "./RevenueChartBars";

type RevenueChartProps = {
  /** Gap-filled series, oldest first — empty buckets included (see `IAnalyticsRepository`). */
  points: RevenuePoint[];
  granularity: AnalyticsGranularity;
};

/**
 * Revenue over the selected period, one bar per bucket.
 *
 * A server component around a client chart: the translated strings and locale
 * formatting are resolved here (a Client Component can't call `getTranslations`),
 * then handed to `RevenueChartBars` as plain data. Changing the period is a
 * navigation that re-runs this whole render — the chart itself has no state of
 * its own to be reactive about.
 *
 * Every point carries its full translated hover string, so hovering any bucket
 * names its date, revenue and order count — the read that makes a chart
 * answerable rather than decorative.
 */
export async function RevenueChart({ points, granularity }: RevenueChartProps) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const dir = getLangDir(locale);

  const peak = points.reduce((max, point) => Math.max(max, point.revenue), 0);

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{t("revenueChart")}</h2>
        {/* The scale, stated. A bar chart with no y-axis is a shape, not a measure —
            and the peak is the single number that turns one into the other. */}
        <p className="text-body-b8 text-muted-foreground">
          {t("chartPeak", { amount: formatMoney(peak, locale) })}
        </p>
      </div>

      {peak > 0 ? (
        <>
          <div className="mt-4" aria-hidden>
            <RevenueChartBars
              dir={dir}
              data={points.map((point) => ({
                bucket: point.bucket,
                label: formatBucketLabel(point.bucket, granularity, locale),
                revenue: point.revenue,
                tooltipLabel: t("chartPoint", {
                  date: formatBucketLabel(point.bucket, granularity, locale),
                  amount: formatMoney(point.revenue, locale),
                  orders: formatNumber(point.orders, locale),
                }),
              }))}
            />
          </div>

          {/* The chart's own content is decorative markup; this is what a screen
              reader gets, and it's the summary a sighted reader takes from the
              shape anyway. */}
          <p className="sr-only">
            {t("chartSummary", {
              count: points.length,
              amount: formatMoney(
                points.reduce((sum, point) => sum + point.revenue, 0),
                locale,
              ),
            })}
          </p>
        </>
      ) : (
        <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{t("chartEmpty")}</p>
      )}
    </section>
  );
}
