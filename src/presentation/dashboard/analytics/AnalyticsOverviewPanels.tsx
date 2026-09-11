import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  MapPin,
  TriangleAlert,
  Receipt,
  RefreshCcw,
  ShoppingBag,
  Star,
  Truck,
  Users,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { percentChange, type OrderStatusCount } from "@/src/domain/entities/Analytics";
import type { OrderStatus } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { StatCardCarousel } from "@/src/presentation/dashboard/StatCardCarousel";
import { StatSparkline } from "@/src/presentation/dashboard/StatSparkline";
import { Icon } from "@/src/presentation/design-system";

import type { AnalyticsOverviewWire } from "./analytics-response-schema";

type Kpi = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  delta: number | null;
  invertDelta?: boolean;
  trend?: number[];
  suffix?: string;
};

export async function AnalyticsKpiStrip({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale());
  const { totals, previousTotals, customerSegments, previousCustomerSegments } = analytics;
  const totalStatuses = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const refunded = countStatus(analytics.statusBreakdown, "refunded");
  const returns = countStatus(analytics.statusBreakdown, "return_requested");
  const refundRate = totals.orders > 0 ? (refunded + returns) / totals.orders : 0;
  const completed = countStatus(analytics.statusBreakdown, "completed");
  const deliveryRate = totalStatuses > 0 ? completed / totalStatuses : 0;
  const previousRefundRate = previousTotals.orders > 0 ? refunded / previousTotals.orders : 0;
  const kpis: Kpi[] = [
    { key: "revenue", label: t("kpiNetSales"), value: formatMoney(totals.revenue, locale), icon: CircleDollarSign, tone: "bg-accent text-primary", delta: percentChange(totals.revenue, previousTotals.revenue), trend: analytics.revenueSeries.map((point) => point.revenue) },
    { key: "orders", label: t("kpiOrders"), value: formatNumber(totalStatuses, locale), icon: ShoppingBag, tone: "bg-info text-info-foreground", delta: percentChange(totals.orders, previousTotals.orders), trend: analytics.revenueSeries.map((point) => point.orders) },
    { key: "aov", label: t("kpiAverageOrderValue"), value: formatMoney(totals.averageOrderValue, locale), icon: Receipt, tone: "bg-warning text-warning-foreground", delta: percentChange(totals.averageOrderValue, previousTotals.averageOrderValue), trend: analytics.revenueSeries.map((point) => point.orders > 0 ? point.revenue / point.orders : 0) },
    { key: "delivery", label: t("kpiOnTimeDelivery"), value: formatPercent(deliveryRate, locale), icon: Truck, tone: "bg-success text-success-foreground", delta: null, trend: analytics.revenueSeries.map((point) => point.orders) },
    { key: "refund", label: t("kpiRefundedOrderRate"), value: formatPercent(refundRate, locale), icon: RefreshCcw, tone: "bg-error text-destructive", delta: refundRate - previousRefundRate, invertDelta: true, trend: [previousRefundRate, refundRate] },
    { key: "customers", label: t("activeCustomers"), value: formatNumber(customerSegments.totalCustomers, locale), icon: Users, tone: "bg-success text-success-foreground", delta: percentChange(customerSegments.totalCustomers, previousCustomerSegments.totalCustomers), trend: [previousCustomerSegments.totalCustomers, customerSegments.totalCustomers] },
  ];

  const cards = kpis.map((kpi) => (
    <KpiCard
      key={kpi.key}
      kpi={kpi}
      locale={locale}
      previousPeriodLabel={t("vsPreviousPeriod")}
      currentPeriodLabel={t("currentPeriod")}
    />
  ));

  return (
    <>
      <div className="sm:hidden">
        <StatCardCarousel>{cards}</StatCardCarousel>
      </div>
      <section className="hidden gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {cards}
      </section>
    </>
  );
}

function KpiCard({ kpi, locale, previousPeriodLabel, currentPeriodLabel }: { kpi: Kpi; locale: Locale; previousPeriodLabel: string; currentPeriodLabel: string }) {
  const percent = kpi.delta === null ? null : Math.round(kpi.delta * 1000) / 10;
  const positive = percent !== null && (kpi.invertDelta ? percent <= 0 : percent >= 0);

  return (
    <article className="flex min-h-36 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <div className="flex items-center gap-3 md:gap-2 xl:gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full md:size-9 xl:size-10 ${kpi.tone}`}>
          <Icon icon={kpi.icon} size="sm" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body-b10 text-muted-foreground md:overflow-visible md:text-clip md:whitespace-normal xl:overflow-hidden xl:text-ellipsis xl:whitespace-nowrap">{kpi.label}</p>
          <p className="truncate text-heading-h3 text-foreground">{kpi.value}</p>
        </div>
      </div>
      <p className="mt-3 flex min-h-5 items-center gap-1 text-body-b10 md:flex-wrap md:items-start xl:flex-nowrap xl:items-center">
        {percent !== null ? (
          <>
            <Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" className={positive ? "text-success-foreground" : "text-destructive"} />
            <span className={positive ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{formatSignedPercent(percent, locale)}</span>
            <span className="truncate text-muted-foreground md:overflow-visible md:text-clip md:whitespace-normal xl:overflow-hidden xl:text-ellipsis xl:whitespace-nowrap">{previousPeriodLabel}</span>
          </>
        ) : <span className="text-muted-foreground">{currentPeriodLabel}</span>}
      </p>
      <div className="mt-auto">{kpi.trend ? <StatSparkline values={kpi.trend} positive={positive || percent === null} /> : <div className="h-9" />}</div>
    </article>
  );
}

export async function PriorityActionsCard({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const processing = countStatus(analytics.statusBreakdown, "processing");
  const returns = countStatus(analytics.statusBreakdown, "return_requested") + countStatus(analytics.statusBreakdown, "refunded");
  const actions = [
    { icon: MapPin, tone: "bg-error text-destructive", title: t("priorityCapacity"), body: t("priorityCapacityBody"), badge: t("priorityCritical"), badgeTone: "bg-error text-destructive" },
    { icon: TriangleAlert, tone: "bg-warning text-warning-foreground", title: t("priorityRefunds"), body: t("priorityRefundsBody", { count: returns }), badge: t("priorityAttention"), badgeTone: "bg-warning text-warning-foreground" },
    { icon: CreditCard, tone: "bg-info text-info-foreground", title: t("priorityPayments", { count: processing }), body: t("priorityPaymentsBody"), badge: t("priorityMonitor"), badgeTone: "bg-info text-info-foreground" },
  ];
  return (
    <section className="rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5 text-foreground">{t("priorityActions")}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {actions.map((action) => (
          <li key={action.title} className="flex items-start gap-3 rounded-card-md border border-border p-4 sm:items-center sm:p-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${action.tone}`}>
              <Icon icon={action.icon} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-body-b7 font-semibold text-foreground">{action.title}</p>
              <p className="mt-1 line-clamp-2 text-body-b6 leading-relaxed text-muted-foreground sm:mt-0.5 sm:line-clamp-1 sm:text-body-b10">{action.body}</p>
            <span className={`mt-2 inline-flex min-h-7 min-w-24 items-center justify-center rounded-card-md px-3 text-body-b7 font-semibold md:hidden ${action.badgeTone}`}>{action.badge}</span>
            </div>
            <span className={`hidden min-h-7 min-w-24 items-center justify-center rounded-card-md px-3 text-body-b7 font-semibold md:inline-flex ${action.badgeTone}`}>{action.badge}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function AnalyticsInsights({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale());
  const revenueChange = percentChange(analytics.totals.revenue, analytics.previousTotals.revenue);
  const aovChange = percentChange(analytics.totals.averageOrderValue, analytics.previousTotals.averageOrderValue);
  const totalStatuses = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const processing = countStatus(analytics.statusBreakdown, "processing");
  const placedAverage = totalStatuses > 0 ? analytics.totals.revenue / totalStatuses : 0;
  const top = analytics.topProducts[0];
  const items = [
    { icon: ArrowUp, tone: "bg-accent text-primary", title: revenueChange === null ? t("insightRevenueCurrent") : t("insightRevenue", { percent: Math.abs(Math.round(revenueChange * 100)) }), body: revenueChange === null ? t("insightRevenueCurrentBody", { current: formatMoney(analytics.totals.revenue, locale) }) : t("insightRevenueBody", { current: formatMoney(analytics.totals.revenue, locale), previous: formatMoney(analytics.previousTotals.revenue, locale) }) },
    { icon: aovChange !== null && aovChange >= 0 ? ArrowUp : ArrowDown, tone: "bg-info text-info-foreground", title: aovChange === null ? t("insightAovCurrent") : t("insightAov", { direction: aovChange >= 0 ? t("increased") : t("decreased"), percent: Math.abs(Math.round(aovChange * 100)) }), body: aovChange === null ? t("insightAovCurrentBody", { current: formatMoney(placedAverage, locale) }) : t("insightAovBody", { current: formatMoney(analytics.totals.averageOrderValue, locale), previous: formatMoney(analytics.previousTotals.averageOrderValue, locale) }) },
    { icon: ClipboardList, tone: "bg-warning text-warning-foreground", title: t("insightProcessing", { percent: totalStatuses > 0 ? Math.round((processing / totalStatuses) * 100) : 0 }), body: t("insightProcessingBody", { count: processing, total: totalStatuses }) },
    ...(top ? [{ icon: Star, tone: "bg-muted text-secondary", title: t("insightTopSeller", { name: top.name }), body: t("insightTopSellerBody", { revenue: formatMoney(top.revenue, locale), units: top.units }), mobileHidden: true }] : []),
  ];

  return (
    <section className="flex h-full flex-col rounded-card-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-body-b5">
          <Icon icon={Star} size="xs" className="hidden text-info-foreground xl:block" />
          {t("insights")}
        </h2>
        <Link href="/dashboard/analytics" className="hidden text-body-b10 text-primary xl:block">{t("viewAll")}</Link>
      </div>
      <ul className="mt-4 divide-y divide-border sm:flex sm:flex-col sm:gap-3 sm:divide-y-0 md:grid md:grid-cols-3 md:gap-0 md:divide-x md:rtl:divide-x-reverse xl:flex xl:gap-3 xl:divide-x-0">
        {items.map((item) => (
          <li key={item.title} className={`items-center gap-3 py-3 first:pt-0 last:pb-0 sm:items-start sm:gap-2.5 sm:py-0 md:px-4 md:py-4 md:first:ps-0 md:first:pt-4 md:last:pe-0 md:last:pb-4 xl:px-0 xl:py-0 xl:first:pt-0 xl:last:pb-0 ${"mobileHidden" in item ? "hidden xl:flex" : "flex"}`}>
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full sm:size-8 ${item.tone}`}>
              <Icon icon={item.icon} size="xs" />
            </span>
            <div className="min-w-0">
              <p className="line-clamp-2 text-body-b7 font-semibold text-foreground sm:truncate sm:text-body-b10 md:line-clamp-2 md:text-clip md:whitespace-normal md:text-body-b7 xl:line-clamp-2 xl:text-clip xl:whitespace-normal">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-body-b10 text-muted-foreground sm:line-clamp-1 md:line-clamp-2 xl:line-clamp-2">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/dashboard/analytics" className="mt-3 flex min-h-11 items-center justify-between border-t border-border pt-3 text-body-b8 font-semibold text-primary sm:hidden md:flex md:min-h-8 md:justify-end md:gap-2 xl:hidden">
        {t("viewAll")}
        <Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" />
      </Link>
    </section>
  );
}

function countStatus(items: OrderStatusCount[], status: OrderStatus): number { return items.find((item) => item.status === status)?.orders ?? 0; }
// Signed % of an already-×100-scaled delta (e.g. `kpi.delta * 100`) — distinct from formatPercent/formatSignedPercent
// in formatNumber.ts, which take a 0–1 ratio. Kept local: this KPI-strip-specific pre-scaling isn't shared elsewhere.
function formatSignedPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(value) + "%"; }
