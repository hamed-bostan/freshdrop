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
import { cn } from "@/src/lib/utils";

type PaymentTrendChartProps = {
  points: RevenuePoint[];
  previousPoints: RevenuePoint[];
  granularity: "day" | "week" | "month";
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
};

type Metric = "amount" | "transactions";

export function PaymentTrendChart({ points, previousPoints, granularity, range, previousRange }: PaymentTrendChartProps) {
  const t = useTranslations("dashPaymentReport");
  const locale = useLocale() as Locale;
  const [metric, setMetric] = useState<Metric>("amount");
  const data = points.map((point, index) => ({
    label: formatBucketLabel(point.bucket, granularity, locale),
    current: metric === "amount" ? point.revenue : point.orders,
    previous: metric === "amount" ? previousPoints[index]?.revenue ?? 0 : previousPoints[index]?.orders ?? 0,
  }));
  const formatValue = (value: number) => metric === "amount" ? formatMoney(value, locale) : formatNumber(value, locale);

  return (
    <section className="rounded-card-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{t("paymentsOverTime")}</h2>
        <div className="flex rounded-input border border-border p-0.5" role="group" aria-label={t("metricLabel")}>
          {(["amount", "transactions"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={cn("h-8 rounded-input px-4 text-body-b10", metric === value ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-muted")}>
              {t(value)}
            </button>
          ))}
        </div>
      </div>
      <ChartLegend payload={[
        { value: `${formatMediumDate(range.from, locale)} – ${formatMediumDate(range.to, locale)}`, color: chartColor(0) },
        { value: `${formatMediumDate(previousRange.from, locale)} – ${formatMediumDate(previousRange.to, locale)}`, color: "var(--color-chart-6)" },
      ]} className="mt-2 justify-start" />
      <div className="mt-2" aria-hidden>
        <ChartContainer height={150} dir={getLangDir(locale)}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={formatValue} />
            <Tooltip content={(props) => <ChartTooltip {...props} renderContent={() => {
              const point = props.payload?.[0]?.payload as { label: string; current: number; previous: number } | undefined;
              return point ? <div className="space-y-1"><p className="text-muted-foreground">{point.label}</p><p>{t("currentValue", { value: formatValue(point.current) })}</p><p className="text-muted-foreground">{t("previousValue", { value: formatValue(point.previous) })}</p></div> : null;
            }} />} />
            <Line type="monotone" dataKey="current" stroke={chartColor(0)} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="previous" stroke="var(--color-chart-6)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
    </section>
  );
}
