import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  MapPin,
  TriangleAlert,
  Receipt,
  RefreshCcw,
  ShoppingBag,
  Star,
  Truck,
  Users,
  Info,
  type LucideIcon,
} from "lucide-react";
import { percentChange, repeatPurchaseRate, type OrderStatusCount } from "@/src/domain/entities/Analytics";
import type { OrderStatus } from "@/src/domain/entities/Order";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { StatSparkline } from "@/src/presentation/dashboard/StatSparkline";
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
  const locale = (await getLocale()) as Locale;
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

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const percent = kpi.delta === null ? null : Math.round(kpi.delta * 1000) / 10;
        const positive = percent !== null && (kpi.invertDelta ? percent <= 0 : percent >= 0);
        return (
          <article key={kpi.key} className="flex min-h-36 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${kpi.tone}`}><Icon icon={kpi.icon} size="sm" /></span>
              <div className="min-w-0"><p className="truncate text-body-b10 text-muted-foreground">{kpi.label}</p><p className="truncate text-heading-h3 text-foreground">{kpi.value}</p></div>
            </div>
            <p className="mt-3 flex min-h-5 items-center gap-1 text-body-b10">
              {percent !== null ? <><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" className={positive ? "text-success-foreground" : "text-destructive"} /><span className={positive ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{formatSignedPercent(percent, locale)}</span><span className="truncate text-muted-foreground">{t("vsPreviousPeriod")}</span></> : <span className="text-muted-foreground">{t("currentPeriod")}</span>}
            </p>
            <div className="mt-auto">{kpi.trend ? <StatSparkline values={kpi.trend} positive={positive || percent === null} /> : <div className="h-9" />}</div>
          </article>
        );
      })}
    </section>
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
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5 text-foreground">{t("priorityActions")}</h2><ul className="mt-3 divide-y divide-border overflow-hidden rounded-card-md border border-border">{actions.map((action) => <li key={action.title} className="flex items-center gap-3 p-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${action.tone}`}><Icon icon={action.icon} size="sm" /></span><div className="min-w-0 flex-1"><p className="truncate text-body-b10 font-semibold text-foreground">{action.title}</p><p className="truncate text-body-b10 text-muted-foreground">{action.body}</p></div><span className={`rounded-card-md px-3 py-1 text-label-l4 font-semibold ${action.badgeTone}`}>{action.badge}</span><Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:rotate-180" /></li>)}</ul></section>;
}

export async function AnalyticsInsights({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
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
    ...(top ? [{ icon: Star, tone: "bg-muted text-secondary", title: t("insightTopSeller", { name: top.name }), body: t("insightTopSellerBody", { revenue: formatMoney(top.revenue, locale), units: top.units }) }] : []),
  ];

  return <section className="h-full rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-body-b5"><Icon icon={Star} size="xs" className="text-info-foreground" />{t("insights")}</h2><Link href="/dashboard/analytics" className="text-body-b10 text-primary">{t("viewAll")}</Link></div><ul className="mt-3 flex flex-col gap-2.5">{items.map((item) => <li key={item.title} className="flex gap-2.5"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.tone}`}><Icon icon={item.icon} size="xs" /></span><div className="min-w-0"><p className="truncate text-body-b10 font-semibold text-foreground">{item.title}</p><p className="mt-0.5 line-clamp-1 text-body-b10 text-muted-foreground">{item.body}</p></div></li>)}</ul></section>;
}

const STATUS_COLOR: Record<OrderStatus, string> = { completed: "var(--color-primary)", processing: "var(--color-info-foreground)", cancelled: "var(--color-error-foreground)", return_requested: "var(--color-warning-foreground)", refunded: "var(--color-muted-foreground)" };

export async function CustomerMixCard({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const segments = analytics.customerSegments;
  const customerStops = donutStops([{ value: segments.newCustomers, color: "var(--color-primary)" }, { value: segments.returningCustomers, color: "var(--color-info-foreground)" }]);
  return <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("customerMix")}</h2><div className="mt-5 flex min-w-0 items-center justify-center gap-4"><div className="relative flex size-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${customerStops})` }} aria-hidden><div className="flex size-[68px] flex-col items-center justify-center rounded-full bg-background"><strong className="text-heading-h3">{formatNumber(segments.totalCustomers, locale)}</strong><span className="text-label-l4 text-muted-foreground">{t("customersLabel")}</span></div></div><ul className="min-w-0 flex-1 space-y-3 text-body-b10"><MixRow color="bg-primary" label={t("newCustomers")} value={segments.newCustomers} total={segments.totalCustomers} locale={locale} /><MixRow color="bg-info-foreground" label={t("returningCustomers")} value={segments.returningCustomers} total={segments.totalCustomers} locale={locale} /></ul></div><div className="mt-auto rounded-card-md border border-primary/20 bg-accent p-3"><div className="flex items-center justify-between gap-3"><span className="text-body-b10 text-muted-foreground">{t("repeatPurchaseRate")}</span><strong className="text-heading-h3 text-primary">{formatPercent(repeatPurchaseRate(segments) ?? 0, locale)}</strong></div>{segments.totalCustomers < 10 ? <p className="mt-2 flex items-center gap-2 text-label-l4 text-muted-foreground"><Icon icon={Info} size="xs" />{t("lowSampleSize")}</p> : null}</div></section>;
}

type HealthTone = "positive" | "negative" | "warning";

/** Compact, decision-oriented summary of the same period metrics shown above. */
export async function BusinessHealthCard({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const healthRow = (label: string, change: number | null) => {
    if (change === null) return { label, status: t("healthMonitor"), tone: "warning" as const, icon: Info };
    if (change >= 0) return { label, status: t("healthGrowing"), tone: "positive" as const, icon: ArrowUp };
    return { label, status: t("healthDeclining"), tone: "negative" as const, icon: ArrowDown };
  };
  const revenueChange = percentChange(analytics.totals.revenue, analytics.previousTotals.revenue);
  const ordersChange = percentChange(analytics.totals.orders, analytics.previousTotals.orders);
  const aovChange = percentChange(analytics.totals.averageOrderValue, analytics.previousTotals.averageOrderValue);
  const totalOrders = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const completedOrders = countStatus(analytics.statusBreakdown, "completed");
  const deliveryRate = totalOrders > 0 ? completedOrders / totalOrders : null;
  const rows: { label: string; status: string; tone: HealthTone; icon: LucideIcon }[] = [
    healthRow(t("kpiNetRevenue"), revenueChange),
    healthRow(t("kpiOrders"), ordersChange),
    healthRow(t("kpiAverageOrder"), aovChange),
    { label: t("kpiRefundRate"), status: t("healthMonitor"), tone: "warning", icon: Info },
    {
      label: t("deliveryPerformance"),
      status: deliveryRate === null ? t("healthMonitor") : deliveryRate >= 0.8 ? t("healthGood") : t("healthMonitor"),
      tone: deliveryRate !== null && deliveryRate >= 0.8 ? "positive" : "warning",
      icon: deliveryRate !== null && deliveryRate >= 0.8 ? ArrowUp : Info,
    },
  ];

  return (
    <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5 text-foreground">{t("businessHealth")}</h2>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex min-w-0 items-center justify-between gap-2 py-1 text-body-b10">
            <span className="truncate text-muted-foreground">{row.label}</span>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-1 font-semibold", healthToneClass(row.tone))}>
              <Icon icon={row.icon} size="xs" />
              {row.status}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/dashboard/analytics" className={cn(focusRing, "mt-auto inline-flex items-center gap-1 pt-3 text-body-b10 font-semibold text-primary hover:underline")}>
        {t("viewHealthReport")}
        <Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" />
      </Link>
    </section>
  );
}

/** Stable routes to the operational reports most often opened from analytics. */
export async function QuickAccessCard() {
  const t = await getTranslations("dashAnalytics");
  const items = [
    { label: t("salesReport"), href: "/dashboard/reports/sales", icon: BarChart3 },
    { label: t("refundsReturns"), href: "/dashboard/reports/refunds", icon: RefreshCcw },
    { label: t("deliveryPerformance"), href: "/dashboard/reports/delivery-performance", icon: Truck },
    { label: t("customerInsights"), href: "/dashboard/reports/customer-insights", icon: Users },
  ] as const;

  return (
    <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5 text-foreground">{t("quickAccess")}</h2>
      <nav className="mt-3 flex flex-col" aria-label={t("quickAccess")}>
        {items.map((item) => (
          <Link key={item.label} href={item.href} className={cn(focusRing, "flex min-w-0 items-center gap-2 rounded-card-md px-1 py-1 text-body-b10 text-foreground hover:bg-muted")}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-card-md bg-muted text-muted-foreground"><Icon icon={item.icon} size="xs" /></span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:rotate-180" />
          </Link>
        ))}
        <Link href="/dashboard/reports/exports" className={cn(focusRing, "flex min-w-0 items-center gap-2 rounded-card-md px-1 py-1 text-body-b10 text-foreground hover:bg-muted")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-card-md bg-muted text-muted-foreground"><Icon icon={Download} size="xs" /></span>
          <span className="min-w-0 flex-1 truncate">{t("exportCenter")}</span>
          <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:rotate-180" />
        </Link>
      </nav>
      <Link href="/dashboard/reports/exports" className={cn(focusRing, "mt-auto flex h-8 items-center justify-center rounded-input border border-primary/40 text-body-b10 font-semibold text-primary hover:bg-accent")}>
        {t("viewAllReports")}
      </Link>
    </section>
  );
}

export async function OrderHealthCard({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const totalOrders = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const orderStops = donutStops(analytics.statusBreakdown.filter((item) => item.orders > 0).map((item) => ({ value: item.orders, color: STATUS_COLOR[item.status] })));
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b8">{t("orderHealth")}</h2><div className="mt-3 flex items-center gap-4"><Donut total={totalOrders} label={t("ordersLabel")} stops={orderStops} /><ul className="min-w-0 flex-1 space-y-1.5 text-body-b10">{analytics.statusBreakdown.filter((item) => item.orders > 0).map((item) => <MixRow key={item.status} color={statusClass(item.status)} label={t(`status.${item.status}`)} value={item.orders} total={totalOrders} locale={locale} />)}</ul></div></section>;
}

export async function AnalyticsSummaryCards({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const total = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const refunded = countStatus(analytics.statusBreakdown, "refunded");
  const returns = countStatus(analytics.statusBreakdown, "return_requested");
  const cancelled = countStatus(analytics.statusBreakdown, "cancelled");
  const repeat = repeatPurchaseRate(analytics.customerSegments) ?? 0;
  return <><SummaryCard icon={CircleDollarSign} title={t("salesSummary")} rows={[{ label: t("kpiNetRevenue"), value: formatMoney(analytics.totals.revenue, locale) }, { label: t("kpiOrders"), value: formatNumber(total, locale) }, { label: t("kpiUnitsSold"), value: formatNumber(analytics.totals.units, locale) }]} /><SummaryCard icon={RefreshCcw} title={t("refundsReturns")} rows={[{ label: t("refundedOrders"), value: formatNumber(refunded, locale) }, { label: t("cancelledOrders"), value: formatNumber(cancelled, locale) }, { label: t("kpiRefundRate"), value: formatPercent(analytics.totals.orders > 0 ? (refunded + returns) / analytics.totals.orders : 0, locale) }]} /><SummaryCard icon={Users} title={t("customerPerformance")} rows={[{ label: t("activeCustomers"), value: formatNumber(analytics.customerSegments.totalCustomers, locale) }, { label: t("returningCustomers"), value: formatNumber(analytics.customerSegments.returningCustomers, locale) }, { label: t("repeatPurchaseRate"), value: formatPercent(repeat, locale) }]} /></>;
}

function SummaryCard({ icon, title, rows }: { icon: LucideIcon; title: string; rows: { label: string; value: string }[] }) { return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-2 text-body-b8"><Icon icon={icon} size="xs" />{title}</h2><dl className="mt-4 space-y-3">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 text-body-b10"><dt className="text-muted-foreground">{row.label}</dt><dd className="font-semibold text-foreground">{row.value}</dd></div>)}</dl></section>; }
function Donut({ total, label, stops }: { total: number; label: string; stops: string }) { return <div className="relative flex size-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }} aria-hidden><div className="flex size-16 flex-col items-center justify-center rounded-full bg-background"><strong className="text-body-b5">{total}</strong><span className="text-label-l4 text-muted-foreground">{label}</span></div></div>; }
function MixRow({ color, label, value, total, locale }: { color: string; label: string; value: number; total: number; locale: Locale }) { return <li className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${color}`} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span><strong>{formatNumber(value, locale)}</strong><span className="w-10 text-end text-muted-foreground">{formatPercent(total > 0 ? value / total : 0, locale)}</span></li>; }
function countStatus(items: OrderStatusCount[], status: OrderStatus): number { return items.find((item) => item.status === status)?.orders ?? 0; }
function donutStops(items: { value: number; color: string }[]): string { const total = items.reduce((sum, item) => sum + item.value, 0); if (total === 0) return "var(--color-muted) 0 100%"; let cursor = 0; return items.map((item) => { const start = cursor; cursor += item.value / total * 100; return `${item.color} ${start}% ${cursor}%`; }).join(", "); }
function statusClass(status: OrderStatus): string { return { completed: "bg-primary", processing: "bg-info-foreground", cancelled: "bg-error-foreground", return_requested: "bg-warning-foreground", refunded: "bg-muted-foreground" }[status]; }
function healthToneClass(tone: HealthTone): string { return { positive: "bg-success text-success-foreground", negative: "bg-error text-destructive", warning: "bg-warning text-warning-foreground" }[tone]; }
// Signed % of an already-×100-scaled delta (e.g. `kpi.delta * 100`) — distinct from formatPercent/formatSignedPercent
// in formatNumber.ts, which take a 0–1 ratio. Kept local: this KPI-strip-specific pre-scaling isn't shared elsewhere.
function formatSignedPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(value) + "%"; }
