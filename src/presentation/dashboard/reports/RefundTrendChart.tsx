"use client";

import { Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenuePoint } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatShortDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { ChartContainer, ChartTooltip, Icon } from "@/src/presentation/design-system";

type Props = { points: RevenuePoint[]; previousPoints: RevenuePoint[]; granularity: "day" | "week" | "month"; range: { from: string; to: string }; previousRange: { from: string; to: string }; title?: string; defaultMetric?: Metric };
type Metric = "count" | "amount";
type Interval = "day" | "week" | "month";
type ChartRow = { label: string; current: number; previous: number };

export function RefundTrendChart({ points, previousPoints, granularity, range, previousRange, title, defaultMetric = "count" }: Props) {
  const t = useTranslations("dashRefundReport");
  const locale = useLocale();
  const [metric, setMetric] = React.useState<Metric>(defaultMetric);
  const [interval, setInterval] = React.useState<Interval>(granularity);
  const availableIntervals: Interval[] = granularity === "month" ? ["month"] : granularity === "week" ? ["week", "month"] : ["day", "week", "month"];
  const data = aggregate(points, previousPoints, metric, interval, locale);
  const format = (value: number) => metric === "amount" ? formatMoney(value, locale) : formatNumber(value, locale);

  return <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-1.5 text-body-b5">{title ?? t("returnedItemsOverTime")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="flex rounded-card-md border border-border p-0.5" aria-label={t("intervalLabel")}>{availableIntervals.map((value) => <button key={value} type="button" aria-pressed={interval === value} onClick={() => setInterval(value)} className={cn("rounded-card-md px-3 py-1 text-body-b10 font-medium", interval === value ? "bg-accent text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t(value)}</button>)}</div></div>
    <div className="mt-3 flex flex-wrap items-center gap-5"><div className="flex rounded-card-md border border-border p-0.5" role="group" aria-label={t("metricLabel")}>{(["count", "amount"] as const).map((value) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={cn("rounded-card-md px-3 py-1.5 text-body-b10 font-semibold", metric === value ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground")}>{t(value === "count" ? "items" : "value")}</button>)}</div><span className="flex items-center gap-2 text-body-b10 text-muted-foreground"><span className="h-0.5 w-5 bg-primary" />{formatShortDate(range.from, locale)} – {formatShortDate(range.to, locale)}</span><span className="flex items-center gap-2 text-body-b10 text-muted-foreground"><span className="w-5 border-t border-dashed border-muted-foreground" />{formatShortDate(previousRange.from, locale)} – {formatShortDate(previousRange.to, locale)}</span></div>
    {data.some((point) => point.current > 0 || point.previous > 0) ? <div className="mt-3" aria-hidden><ChartContainer height={160}><LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={format} /><Tooltip content={(props) => <ChartTooltip {...props} renderContent={() => { const point = props.payload?.[0]?.payload as ChartRow | undefined; return point ? <div className="space-y-1"><p className="font-semibold">{point.label}</p><p className="text-primary">{t("currentValue", { value: format(point.current) })}</p><p className="text-muted-foreground">{t("previousValue", { value: format(point.previous) })}</p></div> : null; }} />} /><Line type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} /><Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer></div> : <p className="py-16 text-center text-body-b8 text-muted-foreground">{t("noCases")}</p>}
    <p className="sr-only">{t("returnedItemsOverTime")}: {data.map((point) => `${point.label}, ${format(point.current)}`).join("; ")}</p>
  </section>;
}

function aggregate(points: RevenuePoint[], previousPoints: RevenuePoint[], metric: Metric, interval: Interval, locale: Locale): ChartRow[] {
  const groups = new Map<string, ChartRow>();
  points.forEach((point, index) => { const date = new Date(point.bucket); const key = interval === "month" ? `${date.getUTCFullYear()}-${date.getUTCMonth()}` : interval === "week" ? String(Math.floor(index / 7)) : String(index); const current = metric === "amount" ? point.revenue : point.orders; const previousPoint = previousPoints[index]; const previous = metric === "amount" ? previousPoint?.revenue ?? 0 : previousPoint?.orders ?? 0; const existing = groups.get(key); if (existing) { existing.current += current; existing.previous += previous; } else groups.set(key, { label: formatShortDate(point.bucket, locale), current, previous }); });
  return [...groups.values()];
}
