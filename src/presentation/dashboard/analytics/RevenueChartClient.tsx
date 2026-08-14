"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";

import type { AnalyticsGranularity, RevenuePoint } from "@/src/domain/entities/Analytics";
import { getLangDir } from "@/src/i18n/direction";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel, formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";
import { ChartContainer, ChartLegend, ChartTooltip, chartColor } from "@/src/presentation/design-system";

export type RevenueChartClientProps = {
  compact?: boolean;
  points: RevenuePoint[];
  previousPoints: RevenuePoint[];
  previousYearPoints: RevenuePoint[];
  granularity: AnalyticsGranularity;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  previousYearRange: { from: string; to: string };
};

type Metric = "revenue" | "orders" | "aov";
type Interval = "daily" | "weekly" | "monthly";
type ChartDatum = { label: string; current: number; compare: number; orders: number };

const METRIC_KEYS: Record<Metric, "metricRevenue" | "metricOrders" | "metricAov"> = {
  revenue: "metricRevenue", orders: "metricOrders", aov: "metricAov",
};

export function RevenueChartClient({ compact = false, points, previousPoints, granularity, range, previousRange }: RevenueChartClientProps) {
  const t = useTranslations("dashAnalytics");
  const locale = useLocale();
  const dir = getLangDir(locale);
  const [metric, setMetric] = React.useState<Metric>("revenue");
  const [interval, setInterval] = React.useState<Interval>("daily");
  const bucketSize = interval === "daily" ? 1 : interval === "weekly" ? 7 : 30;
  const currentPoints = aggregatePoints(points, bucketSize);
  const comparePoints = aggregatePoints(previousPoints, bucketSize);
  const periodPeak = points.reduce((max, point) => Math.max(max, point.revenue), 0);
  const data: ChartDatum[] = currentPoints.map((point, index) => ({
    label: formatBucketLabel(point.bucket, granularity, locale),
    current: metricValue(metric, point),
    compare: metricValue(metric, comparePoints[index]),
    orders: point.orders,
  }));
  const total = metric === "aov" ? aovOf(points.reduce((sum, point) => sum + point.revenue, 0), points.reduce((sum, point) => sum + point.orders, 0)) : data.reduce((sum, point) => sum + point.current, 0);
  const best = data.reduce<ChartDatum | null>((winner, point) => !winner || point.current > winner.current ? point : winner, null);
  const legend = [
    { value: `${formatMediumDate(range.from, locale)} – ${formatMediumDate(range.to, locale)}`, color: chartColor(0) },
    { value: `${formatMediumDate(previousRange.from, locale)} – ${formatMediumDate(previousRange.to, locale)}`, color: "var(--color-chart-6)" },
  ];

  return <section className="rounded-card-lg border border-border bg-background p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-body-b1 text-foreground">{compact ? t("revenueChart") : t("chartOverview")}</h2>
      {compact ? <p className="text-body-b8 text-foreground">{t("chartTotal", { amount: formatMetric(metric, total, locale) })}</p> : null}
      {!compact ? <ChartSegmentedControl value={interval} options={["daily", "weekly", "monthly"]} label={t("intervalLabel")} onChange={setInterval} getLabel={(key) => t(key)} /> : null}
    </div>
    {!compact && periodPeak > 0 ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <ChartSegmentedControl value={metric} options={["revenue", "orders", "aov"]} label={t("metricLabel")} onChange={setMetric} getLabel={(key) => t(key === "revenue" ? "metricNetSales" : METRIC_KEYS[key])} emphasis />
      <ChartLegend payload={legend} className="m-0 justify-start" />
    </div> : null}
    {compact && periodPeak > 0 ? <ChartLegend payload={legend} className="mt-4 hidden justify-start sm:flex" /> : null}
    {periodPeak > 0 ? <>
      <div className="mt-4" aria-hidden><ChartContainer height={compact ? 210 : 220} dir={dir}>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" reversed={dir === "rtl"} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(value: number) => formatMetric(metric, value, locale)} />
          <Tooltip cursor={{ stroke: "var(--color-border)" }} content={(props) => <ChartTooltip {...props} renderContent={() => { const point = props.payload?.[0]?.payload as ChartDatum | undefined; return point ? <div className="space-y-1"><p className="text-muted-foreground">{point.label}</p><p>{t("tooltipCurrent", { amount: formatMetric(metric, point.current, locale) })}</p><p className="text-muted-foreground">{t("tooltipPrevious", { amount: formatMetric(metric, point.compare, locale) })}</p></div> : null; }} />} />
          <Area type="monotone" dataKey="current" stroke={chartColor(0)} fill={chartColor(0)} fillOpacity={0.08} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="compare" stroke="var(--color-chart-6)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ChartContainer></div>
      <p className="sr-only">{t("chartSummary", { metric: t(METRIC_KEYS[metric]), count: data.length, total: formatMetric(metric, total, locale), bestDate: best?.label ?? "", bestAmount: best ? formatMetric(metric, best.current, locale) : "" })}</p>
    </> : <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{t("chartEmpty")}</p>}
  </section>;
}

function aggregatePoints(points: RevenuePoint[], size: number): RevenuePoint[] {
  if (size === 1) return points;
  const result: RevenuePoint[] = [];
  for (let index = 0; index < points.length; index += size) { const group = points.slice(index, index + size); result.push({ bucket: group[0].bucket, revenue: group.reduce((sum, point) => sum + point.revenue, 0), orders: group.reduce((sum, point) => sum + point.orders, 0) }); }
  return result;
}
function metricValue(metric: Metric, point?: RevenuePoint): number { if (!point) return 0; return metric === "revenue" ? point.revenue : metric === "orders" ? point.orders : aovOf(point.revenue, point.orders); }
function formatMetric(metric: Metric, value: number, locale: Locale): string { return metric === "orders" ? formatNumber(value, locale) : formatMoney(value, locale); }
function aovOf(revenue: number, orders: number): number { return orders > 0 ? revenue / orders : 0; }
