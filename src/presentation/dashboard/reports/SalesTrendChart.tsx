"use client";

import { Info } from "lucide-react";
import * as React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import type { Locale } from "@/src/i18n/routing";
import { formatShortDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";
import { ChartContainer, ChartTooltip, Icon } from "@/src/presentation/design-system";

import type { AnalyticsOverviewWire } from "../analytics/analytics-response-schema";

type Metric = "revenue" | "orders";
type Interval = "day" | "week" | "month";

type SalesTrendChartProps = {
  analytics: AnalyticsOverviewWire;
  locale: Locale;
  labels: { heading: string; netSales: string; orders: string; daily: string; weekly: string; monthly: string; empty: string };
};

type ChartRow = { bucket: string; label: string; current: number; previous: number };

export function SalesTrendChart({ analytics, locale, labels }: SalesTrendChartProps) {
  const [metric, setMetric] = React.useState<Metric>("revenue");
  const [interval, setInterval] = React.useState<Interval>(analytics.granularity === "month" ? "month" : analytics.granularity === "week" ? "week" : "day");
  const availableIntervals: Interval[] = analytics.granularity === "month" ? ["month"] : analytics.granularity === "week" ? ["week", "month"] : ["day", "week", "month"];
  const data = aggregateSeries(analytics, metric, interval, locale);
  const hasSales = data.some((point) => point.current > 0 || point.previous > 0);
  const formatter = (value: number) => metric === "revenue" ? formatMoney(value, locale) : formatNumber(value, locale);

  return (
    <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-body-b5 text-foreground">{labels.heading}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>
        <ChartSegmentedControl value={interval} options={availableIntervals} label="Chart interval" onChange={setInterval} getLabel={(value) => value === "day" ? labels.daily : value === "week" ? labels.weekly : labels.monthly} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-5">
        <ChartSegmentedControl value={metric} options={["revenue", "orders"]} label={labels.heading} onChange={setMetric} getLabel={(value) => value === "revenue" ? labels.netSales : labels.orders} emphasis />
        <span className="flex items-center gap-2 text-body-b10 text-muted-foreground"><span className="h-0.5 w-5 bg-primary" />{formatShortDate(analytics.range.from, locale)} – {formatShortDate(analytics.range.to, locale)}</span>
        <span className="flex items-center gap-2 text-body-b10 text-muted-foreground"><span className="w-5 border-t border-dashed border-muted-foreground" />{formatShortDate(analytics.previousRange.from, locale)} – {formatShortDate(analytics.previousRange.to, locale)}</span>
      </div>
      {hasSales ? <div className="mt-3" aria-hidden><ChartContainer height={160}><LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(value: number) => metric === "revenue" ? `$${Math.round(value / 1000)}k` : String(value)} /><Tooltip content={(props) => <ChartTooltip {...props} renderContent={() => { const row = props.payload?.[0]?.payload as ChartRow | undefined; return row ? <div className="space-y-1"><p className="font-semibold text-foreground">{row.label}</p><p className="text-primary">{formatter(row.current)}</p><p className="text-muted-foreground">{formatter(row.previous)}</p></div> : null; }} />} /><Line type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} /><Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer></div> : <p className="py-16 text-center text-body-b7 text-muted-foreground">{labels.empty}</p>}
      <p className="sr-only">{labels.heading}: {data.map((row) => `${row.label}, ${formatter(row.current)}`).join("; ")}</p>
    </section>
  );
}

function aggregateSeries(analytics: AnalyticsOverviewWire, metric: Metric, interval: Interval, locale: Locale): ChartRow[] {
  const groups = new Map<string, ChartRow>();
  analytics.revenueSeries.forEach((point, index) => {
    const date = new Date(point.bucket);
    const key = interval === "month" ? `${date.getUTCFullYear()}-${date.getUTCMonth()}` : interval === "week" ? String(Math.floor(index / 7)) : String(index);
    const current = metric === "revenue" ? point.revenue : point.orders;
    const previousPoint = analytics.previousSeries[index];
    const previous = metric === "revenue" ? (previousPoint?.revenue ?? 0) : (previousPoint?.orders ?? 0);
    const existing = groups.get(key);
    if (existing) { existing.current += current; existing.previous += previous; return; }
    groups.set(key, { bucket: point.bucket, label: formatShortDate(point.bucket, locale), current, previous });
  });
  return [...groups.values()];
}
