"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsGranularity, RevenuePoint } from "@/src/domain/entities/Analytics";
import { getLangDir } from "@/src/i18n/direction";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel, formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { ChartContainer, ChartLegend, ChartTooltip, Select, chartColor } from "@/src/presentation/design-system";

export type RevenueChartClientProps = {
  /** Gap-filled series for the period on screen, oldest first. */
  points: RevenuePoint[];
  /** `previousSeries` — index-aligned to `points` (see `IAnalyticsRepository.compareRevenueSeries`). */
  previousPoints: RevenuePoint[];
  /** `previousYearSeries` — same alignment, sourced from the same days a year earlier. */
  previousYearPoints: RevenuePoint[];
  granularity: AnalyticsGranularity;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  previousYearRange: { from: string; to: string };
};

type Metric = "revenue" | "orders" | "aov";
type Compare = "previous" | "previousYear" | "none";

type ChartDatum = {
  bucket: string;
  label: string;
  current: number;
  compare: number | undefined;
  orders: number;
};

/** Floor point size for a non-zero bar, in pixels — so a small day is visible, not invisible. */

const METRIC_KEYS: Record<Metric, "metricRevenue" | "metricOrders" | "metricAov"> = {
  revenue: "metricRevenue",
  orders: "metricOrders",
  aov: "metricAov",
};

function metricValue(metric: Metric, point: RevenuePoint | undefined): number {
  if (!point) return 0;
  if (metric === "revenue") return point.revenue;
  if (metric === "orders") return point.orders;
  return point.orders > 0 ? point.revenue / point.orders : 0;
}

function formatMetric(metric: Metric, value: number, locale: Locale): string {
  return metric === "orders" ? formatNumber(value, locale) : formatMoney(value, locale);
}

/**
 * Revenue over the selected period, one bar per bucket, with an optional muted
 * second bar comparing against the previous period or the same days a year
 * earlier.
 *
 * Client-only, unlike its predecessor: the metric (Revenue/Orders/AOV) and
 * "compare with" choices are ephemeral view state (no figure they touch isn't
 * already in `points`/`previousPoints`/`previousYearPoints`), and the sr-only
 * summary has to describe whichever of those a screen reader user currently has
 * selected — neither is possible from a Server Component that renders once and
 * never re-runs. Locale and translations are resolved here via `next-intl`'s
 * client hooks rather than handed down, for the same reason: what needs
 * formatting changes with the toggles above it.
 */
export function RevenueChartClient({
  points,
  previousPoints,
  previousYearPoints,
  granularity,
  range,
  previousRange,
  previousYearRange,
}: RevenueChartClientProps) {
  const t = useTranslations("dashAnalytics");
  const locale = useLocale() as Locale;
  const dir = getLangDir(locale);

  const [metric, setMetric] = React.useState<Metric>("revenue");
  const [compare, setCompare] = React.useState<Compare>("previous");

  // Whether the period on screen had any activity at all — independent of which
  // metric or comparison is selected, so toggling those never flips the chart in
  // and out of its empty state. `orders` per bucket is itself gated on revenue > 0
  // (see `PrismaAnalyticsRepository`), so a zero here means every metric is zero.
  const periodPeak = points.reduce((max, point) => Math.max(max, point.revenue), 0);

  const comparePoints =
    compare === "previous" ? previousPoints : compare === "previousYear" ? previousYearPoints : null;
  const compareRange = compare === "previous" ? previousRange : compare === "previousYear" ? previousYearRange : null;

  const data: ChartDatum[] = points.map((point, index) => ({
    bucket: point.bucket,
    label: formatBucketLabel(point.bucket, granularity, locale),
    current: metricValue(metric, point),
    compare: comparePoints ? metricValue(metric, comparePoints[index]) : undefined,
    orders: point.orders,
  }));

  const total =
    metric === "aov"
      ? aovOf(
          points.reduce((sum, point) => sum + point.revenue, 0),
          points.reduce((sum, point) => sum + point.orders, 0),
        )
      : data.reduce((sum, point) => sum + point.current, 0);

  const best = data.reduce<{ label: string; value: number } | null>((max, point) => {
    if (point.current > (max?.value ?? -Infinity)) return { label: point.label, value: point.current };
    return max;
  }, null);

  const currentLegendLabel = `${formatMediumDate(range.from, locale)} – ${formatMediumDate(range.to, locale)}`;
  const compareLegendLabel = compareRange
    ? `${formatMediumDate(compareRange.from, locale)} – ${formatMediumDate(compareRange.to, locale)}`
    : "";

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-body-b5 text-foreground">{t("revenueChart")}</h2>

          {periodPeak > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                size="sm"
                aria-label={t("metricLabel")}
                value={metric}
                onChange={(event) => setMetric(event.target.value as Metric)}
                className="w-auto"
              >
                <option value="revenue">{t("metricRevenue")}</option>
                <option value="orders">{t("metricOrders")}</option>
                <option value="aov">{t("metricAov")}</option>
              </Select>
              <Select
                size="sm"
                aria-label={t("compareLabel")}
                value={compare}
                onChange={(event) => setCompare(event.target.value as Compare)}
                className="w-auto"
              >
                <option value="previous">{t("comparePrevious")}</option>
                <option value="previousYear">{t("comparePreviousYear")}</option>
                <option value="none">{t("compareNone")}</option>
              </Select>
            </div>
          ) : null}
        </div>

        {periodPeak > 0 && best ? (
          <div className="text-end">
            <p className="text-body-b7 text-foreground">
              {t("chartTotal", { amount: formatMetric(metric, total, locale) })}
            </p>
            <p className="text-body-b8 text-muted-foreground">
              {t("chartBestDay", { date: best.label, amount: formatMetric(metric, best.value, locale) })}
            </p>
          </div>
        ) : null}
      </div>

      {periodPeak > 0 ? (
        <>
          <div className="mt-4" aria-hidden>
            <ChartContainer height={160} dir={dir}>
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  reversed={dir === "rtl"}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickFormatter={(value: number) => formatMetric(metric, value, locale)}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      renderContent={() => {
                        const point = props.payload?.[0]?.payload as ChartDatum | undefined;
                        if (!point) return null;
                        return (
                          <div className="flex flex-col gap-1">
                            <p className="text-muted-foreground">{point.label}</p>
                            <p className="text-foreground">
                              {t("tooltipCurrent", { amount: formatMetric(metric, point.current, locale) })}
                            </p>
                            {compare !== "none" && point.compare !== undefined ? (
                              <p className="text-muted-foreground">
                                {t(compare === "previous" ? "tooltipPrevious" : "tooltipPreviousYear", {
                                  amount: formatMetric(metric, point.compare, locale),
                                })}
                              </p>
                            ) : null}
                            {metric !== "orders" ? (
                              <p className="text-muted-foreground">{t("tooltipOrders", { orders: point.orders })}</p>
                            ) : null}
                          </div>
                        );
                      }}
                    />
                  )}
                />
                <Line type="monotone" dataKey="current" stroke={chartColor(0)} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                {compare !== "none" ? (
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke="var(--color-chart-6)"
                    strokeWidth={2}
                    strokeDasharray="6 5"
                    dot={false}
                    isAnimationActive={false}
                  />
                ) : null}
              </LineChart>
            </ChartContainer>
          </div>

          {compare !== "none" ? (
            <ChartLegend
              payload={[
                { value: currentLegendLabel, color: chartColor(0) },
                { value: compareLegendLabel, color: "var(--color-chart-6)" },
              ]}
              className="mt-2"
            />
          ) : null}

          {/* The chart's own content is decorative markup; this is what a screen
              reader gets, and it's the summary a sighted reader takes from the
              shape anyway. Reflects whichever metric/comparison is on screen,
              since those are the numbers the chart is actually showing. */}
          <p className="sr-only">
            {t("chartSummary", {
              metric: t(METRIC_KEYS[metric]),
              count: data.length,
              total: formatMetric(metric, total, locale),
              bestDate: best?.label ?? "",
              bestAmount: best ? formatMetric(metric, best.value, locale) : "",
            })}
          </p>
        </>
      ) : (
        <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{t("chartEmpty")}</p>
      )}
    </section>
  );
}

function aovOf(revenue: number, orders: number): number {
  return orders > 0 ? revenue / orders : 0;
}
