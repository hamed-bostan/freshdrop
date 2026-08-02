"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { getLangDir } from "@/src/i18n/direction";
import { formatBucketLabel, formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { ChartContainer, ChartLegend, ChartTooltip, chartColor } from "@/src/presentation/design-system";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";

type Props = { points: RevenuePoint[]; previousPoints: RevenuePoint[]; granularity: "day" | "week" | "month"; range: { from: string; to: string }; previousRange: { from: string; to: string } };
type Metric = "amount" | "transactions";
type Interval = "daily" | "weekly" | "monthly";

export function PaymentTrendChart({ points, previousPoints, granularity, range, previousRange }: Props) {
  const t = useTranslations("dashPaymentReport");
  const locale = useLocale() as Locale;
  const [metric, setMetric] = useState<Metric>("amount");
  const [interval, setInterval] = useState<Interval>("daily");
  const size = interval === "daily" ? 1 : interval === "weekly" ? 7 : 30;
  const current = aggregatePoints(points, size);
  const previous = aggregatePoints(previousPoints, size);
  const data = current.map((point, index) => ({ label: formatBucketLabel(point.bucket, granularity, locale), current: metric === "amount" ? point.revenue : point.orders, previous: metric === "amount" ? previous[index]?.revenue ?? 0 : previous[index]?.orders ?? 0 }));
  const formatValue = (value: number) => metric === "amount" ? formatMoney(value, locale) : formatNumber(value, locale);

  return <section className="rounded-card-lg border border-border bg-background p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-body-b5 text-foreground">{t("paymentVolumeOverTime")}</h2><ChartSegmentedControl value={interval} options={["daily", "weekly", "monthly"]} label={t("intervalLabel")} onChange={setInterval} getLabel={(value) => t(value)} /></div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><ChartSegmentedControl value={metric} options={["amount", "transactions"]} label={t("metricLabel")} onChange={setMetric} getLabel={(value) => t(value)} emphasis /><ChartLegend payload={[{ value: `${formatMediumDate(range.from, locale)} – ${formatMediumDate(range.to, locale)}`, color: chartColor(0) }, { value: `${formatMediumDate(previousRange.from, locale)} – ${formatMediumDate(previousRange.to, locale)}`, color: "var(--color-chart-6)" }]} className="m-0 justify-start" /></div>
    <div className="mt-2" aria-hidden><ChartContainer height={190} dir={getLangDir(locale)}><LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={formatValue} /><Tooltip content={(props) => <ChartTooltip {...props} renderContent={() => { const point = props.payload?.[0]?.payload as { label: string; current: number; previous: number } | undefined; return point ? <div className="space-y-1"><p className="text-muted-foreground">{point.label}</p><p>{t("currentValue", { value: formatValue(point.current) })}</p><p className="text-muted-foreground">{t("previousValue", { value: formatValue(point.previous) })}</p></div> : null; }} />} /><Line type="monotone" dataKey="current" stroke={chartColor(0)} strokeWidth={2.5} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer></div>
  </section>;
}

function aggregatePoints(points: RevenuePoint[], size: number): RevenuePoint[] { if (size === 1) return points; const result: RevenuePoint[] = []; for (let index = 0; index < points.length; index += size) { const group = points.slice(index, index + size); result.push({ bucket: group[0].bucket, revenue: group.reduce((sum, point) => sum + point.revenue, 0), orders: group.reduce((sum, point) => sum + point.orders, 0) }); } return result; }
