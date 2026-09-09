"use client";
import { Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import type { AnalyticsGranularity } from "@/src/domain/entities/Analytics";
import { getLangDir } from "@/src/i18n/direction";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel, formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";
import { ChartContainer, ChartLegend, ChartTooltip, Icon, chartColor } from "@/src/presentation/design-system";

import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";

type ChartRow = { bucket: string; label: string; current: number; previous: number };

export function DeliveryTrendChart({ report, title }: { report: DeliveryPerformanceWire; title?: string }) {
  const t = useTranslations("dashDeliveryReport"); const locale = useLocale();
  const [interval, setInterval] = React.useState<AnalyticsGranularity>(report.granularity);
  const availableIntervals: AnalyticsGranularity[] = report.granularity === "month" ? ["month"] : report.granularity === "week" ? ["week", "month"] : ["day", "week", "month"];
  const data = aggregateSeries(report, interval, locale);
  return <section className="min-w-0 rounded-card-lg border border-border bg-background p-4 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-1.5 text-heading-h3">{title ?? t("trend")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><ChartSegmentedControl value={interval} options={availableIntervals} label="Chart interval" onChange={setInterval} getLabel={(value) => value === "day" ? t("daily") : value === "week" ? t("weekly") : t("monthly")} /></div>
    <ChartLegend payload={[{ value: `${formatMediumDate(report.range.from, locale)} – ${formatMediumDate(report.range.to, locale)}`, color: chartColor(0) }, { value: `${formatMediumDate(report.previousRange.from, locale)} – ${formatMediumDate(report.previousRange.to, locale)}`, color: "var(--color-chart-6)" }]} className="mt-3 justify-start" />
    <ChartContainer height={190} dir={getLangDir(locale)}><LineChart data={data}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} width={42} /><Tooltip content={(props) => <ChartTooltip {...props} />} /><Line type="monotone" dataKey="current" stroke={chartColor(0)} strokeWidth={2.5} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={1.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer>
  </section>;
}

/**
 * Re-buckets the server's daily/weekly series into a coarser interval, weighting
 * each bucket's on-time rate by its delivered-order volume — a plain average would
 * let a slow 2-order day count the same as a busy 80-order day.
 */
function aggregateSeries(report: DeliveryPerformanceWire, interval: AnalyticsGranularity, locale: Locale): ChartRow[] {
  const groups = new Map<string, { bucket: string; deliveredSum: number; onTimeSum: number; previousDeliveredSum: number; previousOnTimeSum: number }>();
  report.series.forEach((point, index) => {
    const date = new Date(point.bucket);
    const key = interval === "month" ? `${date.getUTCFullYear()}-${date.getUTCMonth()}` : interval === "week" ? String(Math.floor(index / 7)) : String(index);
    const previousPoint = report.previousSeries[index];
    const existing = groups.get(key);
    if (existing) {
      existing.deliveredSum += point.deliveredOrders;
      existing.onTimeSum += point.onTimeRate * point.deliveredOrders;
      existing.previousDeliveredSum += previousPoint?.deliveredOrders ?? 0;
      existing.previousOnTimeSum += (previousPoint?.onTimeRate ?? 0) * (previousPoint?.deliveredOrders ?? 0);
      return;
    }
    groups.set(key, {
      bucket: point.bucket,
      deliveredSum: point.deliveredOrders,
      onTimeSum: point.onTimeRate * point.deliveredOrders,
      previousDeliveredSum: previousPoint?.deliveredOrders ?? 0,
      previousOnTimeSum: (previousPoint?.onTimeRate ?? 0) * (previousPoint?.deliveredOrders ?? 0),
    });
  });
  return [...groups.values()].map((group) => ({
    bucket: group.bucket,
    label: formatBucketLabel(group.bucket, interval, locale),
    current: group.deliveredSum ? (group.onTimeSum / group.deliveredSum) * 100 : 0,
    previous: group.previousDeliveredSum ? (group.previousOnTimeSum / group.previousDeliveredSum) * 100 : 0,
  }));
}
