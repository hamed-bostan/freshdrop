"use client";
import { Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { getLangDir } from "@/src/i18n/direction";
import { formatBucketLabel, formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { ChartContainer, ChartLegend, ChartTooltip, Icon, chartColor } from "@/src/presentation/design-system";

import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";

export function DeliveryTrendChart({ report, title }: { report: DeliveryPerformanceWire; title?: string }) {
  const t = useTranslations("dashDeliveryReport"); const locale = useLocale();
  const data = report.series.map((point, index) => ({ label: formatBucketLabel(point.bucket, report.granularity, locale), current: point.onTimeRate * 100, previous: (report.previousSeries[index]?.onTimeRate ?? 0) * 100 }));
  return <section className="min-w-0 rounded-card-lg border border-border bg-background p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-1.5 text-body-b5">{title ?? t("trend")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="flex rounded-card-md border border-border p-0.5 text-body-b10"><span className="rounded-card-md bg-accent px-4 py-1 text-primary">{t("daily")}</span><span className="px-4 py-1 text-muted-foreground">{t("weekly")}</span><span className="px-4 py-1 text-muted-foreground">{t("monthly")}</span></div></div>
    <ChartLegend payload={[{ value: `${formatMediumDate(report.range.from, locale)} – ${formatMediumDate(report.range.to, locale)}`, color: chartColor(0) }, { value: `${formatMediumDate(report.previousRange.from, locale)} – ${formatMediumDate(report.previousRange.to, locale)}`, color: "var(--color-chart-6)" }]} className="mt-3 justify-start" />
    <ChartContainer height={190} dir={getLangDir(locale)}><LineChart data={data}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} width={42} /><Tooltip content={(props) => <ChartTooltip {...props} />} /><Line type="monotone" dataKey="current" stroke={chartColor(0)} strokeWidth={2.5} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={1.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer>
  </section>;
}
