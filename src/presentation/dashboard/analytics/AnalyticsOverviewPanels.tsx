import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  ClipboardList,
  PackageCheck,
  Receipt,
  RefreshCcw,
  ShoppingBag,
  Star,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { percentChange, repeatPurchaseRate, type OrderStatusCount } from "@/src/domain/entities/Analytics";
import type { OrderStatus } from "@/src/domain/entities/Order";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, Thumbnail } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { StatSparkline } from "@/src/presentation/dashboard/StatSparkline";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import type { RevenueRankRow } from "./RevenueRankPanel";

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
  const placedAverage = totalStatuses > 0 ? totals.revenue / totalStatuses : 0;
  const kpis: Kpi[] = [
    { key: "revenue", label: t("kpiNetRevenue"), value: formatMoney(totals.revenue, locale), icon: CircleDollarSign, tone: "bg-accent text-primary", delta: percentChange(totals.revenue, previousTotals.revenue), trend: analytics.revenueSeries.map((point) => point.revenue) },
    { key: "orders", label: t("kpiOrders"), value: formatNumber(totalStatuses, locale), icon: ShoppingBag, tone: "bg-info text-info-foreground", delta: null, trend: analytics.revenueSeries.map((point) => point.orders) },
    { key: "units", label: t("kpiUnitsSold"), value: formatNumber(totals.units, locale), icon: PackageCheck, tone: "bg-muted text-secondary", delta: percentChange(totals.units, previousTotals.units), trend: analytics.topProducts.slice(0, 12).map((item) => item.units) },
    { key: "aov", label: t("kpiAverageOrder"), value: formatMoney(placedAverage, locale), icon: Receipt, tone: "bg-warning text-warning-foreground", delta: null, trend: analytics.revenueSeries.map((point) => point.orders > 0 ? point.revenue / point.orders : 0) },
    { key: "new", label: t("newCustomers"), value: formatNumber(customerSegments.newCustomers, locale), icon: UserRoundPlus, tone: "bg-success text-success-foreground", delta: percentChange(customerSegments.newCustomers, previousCustomerSegments.newCustomers), trend: [previousCustomerSegments.newCustomers, customerSegments.newCustomers] },
    { key: "refund", label: t("kpiRefundRate"), value: formatPercent(refundRate, locale), icon: RefreshCcw, tone: "bg-error text-error-foreground", delta: null, invertDelta: true },
  ];

  return (
    <section className="grid overflow-hidden rounded-card-lg border border-border bg-background sm:grid-cols-2 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const percent = kpi.delta === null ? null : Math.round(kpi.delta * 1000) / 10;
        const positive = percent !== null && (kpi.invertDelta ? percent <= 0 : percent >= 0);
        return (
          <article key={kpi.key} className="min-w-0 border-b border-border p-4 last:border-b-0 sm:border-e xl:border-b-0">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${kpi.tone}`}><Icon icon={kpi.icon} size="sm" /></span>
              <div className="min-w-0"><p className="truncate text-body-b10 text-muted-foreground">{kpi.label}</p><p className="truncate text-heading-h3 text-foreground">{kpi.value}</p></div>
            </div>
            <p className="mt-3 flex min-h-5 items-center gap-1 text-body-b10">
              {percent !== null ? <><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" className={positive ? "text-success-foreground" : "text-destructive"} /><span className={positive ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{formatSignedPercent(percent, locale)}</span><span className="truncate text-muted-foreground">{t("vsPreviousPeriod")}</span></> : <span className="text-muted-foreground">{t("currentPeriod")}</span>}
            </p>
            {kpi.trend ? <StatSparkline values={kpi.trend} positive={positive || percent === null} /> : <div className="h-9" />}
          </article>
        );
      })}
    </section>
  );
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

  return <section className="h-full rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-body-b5"><Icon icon={Star} size="xs" className="text-info-foreground" />{t("insights")}</h2><Link href="/dashboard/analytics" className="text-body-b10 text-primary">{t("viewAll")}</Link></div><ul className="mt-4 flex flex-col gap-4">{items.map((item) => <li key={item.title} className="flex gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.tone}`}><Icon icon={item.icon} size="xs" /></span><div><p className="text-body-b8 text-foreground">{item.title}</p><p className="mt-0.5 text-body-b10 text-muted-foreground">{item.body}</p></div></li>)}</ul></section>;
}

export async function CompactRankingTable({ heading, rows, nameLabel, viewAllHref }: { heading: string; rows: RevenueRankRow[]; nameLabel: string; viewAllHref: string }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  return <section className="rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><h2 className="text-body-b8">{heading}</h2><Link href={viewAllHref} className="text-body-b10 text-primary">{t("viewAll")}</Link></div>{rows.length > 0 ? <table className="mt-3 w-full text-body-b10"><thead className="bg-surface-sunken text-muted-foreground"><tr><th className="px-2 py-1.5 text-start">#</th><th className="px-2 py-1.5 text-start">{nameLabel}</th><th className="px-2 py-1.5 text-end">{t("colUnits")}</th><th className="px-2 py-1.5 text-end">{t("colRevenue")}</th></tr></thead><tbody className="divide-y divide-border">{rows.slice(0, 5).map((row, index) => <tr key={row.id}><td className="px-2 py-1 text-muted-foreground">{formatNumber(index + 1, locale)}</td><td className="max-w-40 px-2 py-1"><span className="flex items-center gap-2">{row.imageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={row.imageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : null}<span className="truncate text-foreground">{row.label}</span></span></td><td className="px-2 py-1 text-end text-muted-foreground">{formatNumber(row.units, locale)}</td><td className="px-2 py-1 text-end text-foreground">{formatMoney(row.revenue, locale)}</td></tr>)}</tbody></table> : <p className="py-8 text-center text-body-b10 text-muted-foreground">{t("noSales")}</p>}</section>;
}

const STATUS_COLOR: Record<OrderStatus, string> = { completed: "var(--color-primary)", processing: "var(--color-info-foreground)", cancelled: "var(--color-error-foreground)", return_requested: "var(--color-warning-foreground)", refunded: "var(--color-muted-foreground)" };

export async function AnalyticsMixCards({ analytics }: { analytics: AnalyticsOverviewWire }) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const segments = analytics.customerSegments;
  const totalOrders = analytics.statusBreakdown.reduce((sum, item) => sum + item.orders, 0);
  const customerStops = donutStops([{ value: segments.newCustomers, color: "var(--color-primary)" }, { value: segments.returningCustomers, color: "var(--color-info-foreground)" }]);
  const orderStops = donutStops(analytics.statusBreakdown.filter((item) => item.orders > 0).map((item) => ({ value: item.orders, color: STATUS_COLOR[item.status] })));
  return <><section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b8">{t("customerMix")}</h2><div className="mt-3 flex items-center gap-4"><Donut total={segments.totalCustomers} label={t("customersLabel")} stops={customerStops} /><ul className="min-w-0 flex-1 space-y-2 text-body-b10"><MixRow color="bg-primary" label={t("newCustomers")} value={segments.newCustomers} total={segments.totalCustomers} locale={locale} /><MixRow color="bg-info-foreground" label={t("returningCustomers")} value={segments.returningCustomers} total={segments.totalCustomers} locale={locale} /></ul></div><div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-body-b10"><span className="text-muted-foreground">{t("repeatPurchaseRate")}</span><strong>{formatPercent(repeatPurchaseRate(segments) ?? 0, locale)}</strong></div></section><section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b8">{t("orderHealth")}</h2><div className="mt-3 flex items-center gap-4"><Donut total={totalOrders} label={t("ordersLabel")} stops={orderStops} /><ul className="min-w-0 flex-1 space-y-1.5 text-body-b10">{analytics.statusBreakdown.filter((item) => item.orders > 0).map((item) => <MixRow key={item.status} color={statusClass(item.status)} label={t(`status.${item.status}`)} value={item.orders} total={totalOrders} locale={locale} />)}</ul></div></section></>;
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
function formatPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
function formatSignedPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(value) + "%"; }
