import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  Info,
  PackageOpen,
  Receipt,
  RefreshCcw,
  ShoppingBag,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { percentChange, repeatPurchaseRate } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Icon } from "@/src/presentation/design-system";
import { StatSparkline } from "@/src/presentation/dashboard/StatSparkline";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";

type MetricCard = {
  key: string;
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
  iconTone: string;
  chartColor: string;
  delta: number | null;
  deltaUnit?: "percent" | "points";
  inverse?: boolean;
  values: number[];
};

export async function AnalyticsMetricGrid({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const { totals, previousTotals, customerSegments, previousCustomerSegments } = analytics;
  const returns = statusCount(analytics, "return_requested") + statusCount(analytics, "refunded");
  const refundRate = totals.orders > 0 ? returns / totals.orders : 0;
  const repeatRate = repeatPurchaseRate(customerSegments) ?? 0;
  const previousRepeatRate = repeatPurchaseRate(previousCustomerSegments);
  const aovSeries = analytics.revenueSeries.map((point) => point.orders > 0 ? point.revenue / point.orders : 0);
  const metrics: MetricCard[] = [
    { key: "revenue", label: t("kpiNetRevenue"), value: formatMoney(totals.revenue, locale), icon: CircleDollarSign, iconTone: "bg-accent text-primary", chartColor: "var(--color-primary)", delta: percentChange(totals.revenue, previousTotals.revenue), values: analytics.revenueSeries.map((point) => point.revenue) },
    { key: "orders", label: t("kpiOrders"), value: formatNumber(totals.orders, locale), icon: ShoppingBag, iconTone: "bg-info text-info-foreground", chartColor: "var(--color-chart-2)", delta: percentChange(totals.orders, previousTotals.orders), values: analytics.revenueSeries.map((point) => point.orders) },
    { key: "aov", label: t("kpiAverageOrder"), value: formatMoney(totals.averageOrderValue, locale), icon: Receipt, iconTone: "bg-warning text-warning-foreground", chartColor: "var(--color-chart-4)", delta: percentChange(totals.averageOrderValue, previousTotals.averageOrderValue), values: aovSeries },
    { key: "refund", label: t("kpiRefundRate"), value: formatPercent(refundRate, locale), icon: RefreshCcw, iconTone: "bg-error text-error-foreground", chartColor: "var(--color-destructive)", delta: null, inverse: true, values: [refundRate, refundRate] },
    { key: "units", label: t("kpiUnitsSold"), value: formatNumber(totals.units, locale), icon: PackageOpen, iconTone: "bg-muted text-secondary", chartColor: "var(--color-chart-3)", delta: percentChange(totals.units, previousTotals.units), values: [previousTotals.units, totals.units] },
    { key: "new", label: t("newCustomers"), value: formatNumber(customerSegments.newCustomers, locale), icon: UserRoundPlus, iconTone: "bg-success text-success-foreground", chartColor: "var(--color-primary)", delta: percentChange(customerSegments.newCustomers, previousCustomerSegments.newCustomers), values: [previousCustomerSegments.newCustomers, customerSegments.newCustomers] },
    { key: "returning", label: t("returningCustomers"), value: formatNumber(customerSegments.returningCustomers, locale), icon: UsersRound, iconTone: "bg-info text-info-foreground", chartColor: "var(--color-chart-2)", delta: percentChange(customerSegments.returningCustomers, previousCustomerSegments.returningCustomers), values: [previousCustomerSegments.returningCustomers, customerSegments.returningCustomers] },
    { key: "repeat", label: t("repeatPurchaseRate"), value: formatPercent(repeatRate, locale), icon: ShoppingBag, iconTone: "bg-surface-sunken text-primary", chartColor: "var(--color-chart-1)", delta: previousRepeatRate === null ? null : repeatRate - previousRepeatRate, deltaUnit: "points", values: [previousRepeatRate ?? repeatRate, repeatRate] },
  ];

  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCardView key={metric.key} metric={metric} locale={locale} currentPeriodLabel={t("currentPeriod")} comparisonLabel={t("vsPreviousPeriod")} />)}</section>;
}

function MetricCardView({ metric, locale, currentPeriodLabel, comparisonLabel }: { metric: MetricCard; locale: Locale; currentPeriodLabel: string; comparisonLabel: string }) {
  const change = metric.delta === null ? null : metric.deltaUnit === "points" ? metric.delta * 100 : metric.delta * 100;
  const favorable = change !== null && (metric.inverse ? change <= 0 : change >= 0);
  return (
    <article className="flex min-h-32 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${metric.iconTone}`}>
          <Icon icon={metric.icon} size="sm" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-body-b10 text-muted-foreground">
            <span className="truncate">{metric.label}</span>
            <Icon icon={Info} size="xs" aria-hidden />
          </p>
          <p className="mt-0.5 truncate text-heading-h3 text-foreground">{metric.value}</p>
        </div>
      </div>
      <p className="mt-2 flex min-h-4 min-w-0 items-center gap-1 text-body-b10">
        {change === null ? (
          <span className="truncate text-muted-foreground">{currentPeriodLabel}</span>
        ) : (
          <>
            <Icon icon={change >= 0 ? ArrowUp : ArrowDown} size="xs" className={favorable ? "text-success-foreground" : "text-destructive"} />
            <span className={favorable ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{formatSigned(change, locale, metric.deltaUnit)}</span>
            <span className="truncate text-muted-foreground">{comparisonLabel}</span>
          </>
        )}
      </p>
      <div className="mt-auto pt-1"><StatSparkline values={metric.values} positive={favorable} color={metric.chartColor} heightClassName="h-7" /></div>
    </article>
  );
}

function statusCount(analytics: AnalyticsOverviewWire, status: "return_requested" | "refunded"): number { return analytics.statusBreakdown.find((item) => item.status === status)?.orders ?? 0; }
function formatPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
function formatSigned(value: number, locale: Locale, unit?: "percent" | "points"): string { const formatted = new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(value); return unit === "points" ? `${formatted} pp` : `${formatted}%`; }
