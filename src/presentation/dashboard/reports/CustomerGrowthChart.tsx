"use client";
import { Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import type { AnalyticsGranularity } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatBucketLabel, formatShortDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";
import { ChartContainer, ChartTooltip, Icon } from "@/src/presentation/design-system";

import type { CustomerInsightsWire } from "./customer-insights-response-schema";

type Metric = "customers" | "revenue";
type ChartRow = { label: string; newCustomers: number; returningCustomers: number; previousNew: number; previousReturning: number };

export function CustomerGrowthChart({ report }: { report: CustomerInsightsWire }) {
  const t = useTranslations("dashCustomerInsights"); const locale = useLocale(); const [metric, setMetric] = React.useState<Metric>("customers");
  const [interval, setInterval] = React.useState<AnalyticsGranularity>(report.granularity);
  const availableIntervals: AnalyticsGranularity[] = report.granularity === "month" ? ["month"] : report.granularity === "week" ? ["week", "month"] : ["day", "week", "month"];
  const data = aggregateGrowth(report, interval, metric, locale);
  const format = (value: number) => metric === "customers" ? formatNumber(value, locale) : formatMoney(value, locale);
  return <section className="min-h-[360px] min-w-0 rounded-card-lg border border-border bg-background p-4 md:min-h-[440px] md:p-6 xl:min-h-[380px]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-1.5 text-heading-h3">{t("growthOverTime")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><ChartSegmentedControl value={interval} options={availableIntervals} label="Chart interval" onChange={setInterval} getLabel={(value) => value === "day" ? t("daily") : value === "week" ? t("weekly") : t("monthly")} emphasis /></div>
    <div className="mt-3 flex flex-wrap items-center gap-5"><div className="flex rounded-card-md border border-border p-0.5">{(["customers", "revenue"] as const).map((value) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={cn("min-h-11 rounded-card-md px-3 py-1.5 text-body-b7 font-semibold sm:min-h-8 sm:text-body-b10", metric === value ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground")}>{t(value)}</button>)}</div><div className="flex flex-wrap gap-x-5 gap-y-2 text-body-b10 text-muted-foreground"><Legend color="bg-primary" label={t("newCustomers")} /><Legend color="border-primary" label={t("newPrevious")} dashed /><Legend color="bg-info-foreground" label={t("returningCustomers")} /><Legend color="border-info-foreground" label={t("returningPrevious")} dashed /></div></div>
    {data.some((point) => point.newCustomers > 0 || point.returningCustomers > 0) ? <div className="mt-3" aria-hidden><ChartContainer height={220}><LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={format} /><Tooltip content={(props) => <ChartTooltip {...props} />} /><Line type="monotone" dataKey="newCustomers" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="previousNew" stroke="var(--color-primary)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="returningCustomers" stroke="var(--color-info-foreground)" strokeWidth={2} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="previousReturning" stroke="var(--color-info-foreground)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} /></LineChart></ChartContainer></div> : <p className="py-16 text-center text-body-b8 text-muted-foreground">{t("noData")}</p>}<p className="sr-only">{t("growthOverTime")}: {data.map((point) => `${point.label}, ${format(point.newCustomers + point.returningCustomers)}`).join("; ")}. {formatShortDate(report.range.from, locale)}–{formatShortDate(report.range.to, locale)}</p></section>;
}
function Legend({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) { return <span className="flex items-center gap-2"><span className={dashed ? `w-5 border-t border-dashed ${color}` : `h-0.5 w-5 ${color}`} />{label}</span>; }

/** Re-buckets the server's daily series into a coarser interval by summing counts/amounts per group. */
function aggregateGrowth(report: CustomerInsightsWire, interval: AnalyticsGranularity, metric: Metric, locale: Locale): ChartRow[] {
  const groups = new Map<string, { bucket: string; newCustomers: number; returningCustomers: number; previousNew: number; previousReturning: number }>();
  report.growth.forEach((point, index) => {
    const date = new Date(point.bucket);
    const key = interval === "month" ? `${date.getUTCFullYear()}-${date.getUTCMonth()}` : interval === "week" ? String(Math.floor(index / 7)) : String(index);
    const previousPoint = report.previousGrowth[index];
    const newValue = metric === "customers" ? point.newCustomers : point.newRevenue;
    const returningValue = metric === "customers" ? point.returningCustomers : point.returningRevenue;
    const previousNewValue = metric === "customers" ? previousPoint?.newCustomers ?? 0 : previousPoint?.newRevenue ?? 0;
    const previousReturningValue = metric === "customers" ? previousPoint?.returningCustomers ?? 0 : previousPoint?.returningRevenue ?? 0;
    const existing = groups.get(key);
    if (existing) {
      existing.newCustomers += newValue;
      existing.returningCustomers += returningValue;
      existing.previousNew += previousNewValue;
      existing.previousReturning += previousReturningValue;
      return;
    }
    groups.set(key, { bucket: point.bucket, newCustomers: newValue, returningCustomers: returningValue, previousNew: previousNewValue, previousReturning: previousReturningValue });
  });
  return [...groups.values()].map((group) => ({ label: formatBucketLabel(group.bucket, interval, locale), newCustomers: group.newCustomers, returningCustomers: group.returningCustomers, previousNew: group.previousNew, previousReturning: group.previousReturning }));
}
