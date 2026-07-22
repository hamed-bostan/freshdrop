import { getLocale, getTranslations } from "next-intl/server";
import type { AnalyticsGranularity, RevenuePoint } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

type RevenueChartProps = {
  /** Gap-filled series, oldest first — empty buckets included (see `IAnalyticsRepository`). */
  points: RevenuePoint[];
  granularity: AnalyticsGranularity;
};

/** How many x-axis ticks to draw at most before labels start colliding. */
const MAX_TICKS = 7;

/** Floor height for a non-zero bar, as a percentage — so a small day is visible, not invisible. */
const MIN_VISIBLE_PERCENT = 2;

/**
 * Revenue over the selected period, one bar per bucket.
 *
 * A server component drawing plain elements rather than a charting library: the
 * data is already computed, the shape is a bar per bucket, and pulling in a chart
 * runtime would ship JavaScript to render numbers that never change after the
 * server sent them. Changing the period is a navigation, not a client update — so
 * there is nothing here for a client chart to be reactive about.
 *
 * CSS heights rather than an SVG viewBox, because the chart has to be responsive:
 * an SVG scaled with `preserveAspectRatio="none"` distorts its own stroke widths
 * and text, and one scaled correctly leaves the bars a fixed size on a wide screen.
 * Flex bars are the shape the layout engine is already good at.
 *
 * Every bar carries a `title`, so hovering any bucket names its date, revenue and
 * order count — the read that makes a chart answerable rather than decorative,
 * with no tooltip runtime behind it.
 */
export async function RevenueChart({ points, granularity }: RevenueChartProps) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;

  const peak = points.reduce((max, point) => Math.max(max, point.revenue), 0);
  // Which buckets get an x-axis label. Spread evenly and always including the last,
  // so the axis is anchored at the end of the period the reader chose.
  const tickEvery = Math.max(1, Math.ceil(points.length / MAX_TICKS));

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
          <div className="mt-4 flex h-40 items-end gap-[2px]" role="presentation">
            {points.map((point) => {
              const share = peak > 0 ? (point.revenue / peak) * 100 : 0;
              const height = point.revenue > 0 ? Math.max(share, MIN_VISIBLE_PERCENT) : 0;

              return (
                <div key={point.bucket} className="flex h-full flex-1 items-end">
                  <div
                    className={
                      point.revenue > 0
                        ? "w-full rounded-t-sm bg-primary"
                        : // A zero bucket still draws a hairline at the baseline: a
                          // gap in a row of bars reads as missing data, where a flat
                          // mark reads as the "no sales" it is.
                          "w-full rounded-t-sm bg-border"
                    }
                    style={{ height: point.revenue > 0 ? `${height}%` : "2px" }}
                    title={t("chartPoint", {
                      date: formatBucketLabel(point.bucket, granularity, locale),
                      amount: formatMoney(point.revenue, locale),
                      orders: formatNumber(point.orders, locale),
                    })}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-[2px]" aria-hidden>
            {points.map((point, index) => (
              <div key={point.bucket} className="min-w-0 flex-1 text-center">
                {index % tickEvery === 0 || index === points.length - 1 ? (
                  <span className="truncate text-body-b8 text-muted-foreground">
                    {formatBucketLabel(point.bucket, granularity, locale)}
                  </span>
                ) : null}
              </div>
            ))}
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
