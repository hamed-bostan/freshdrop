import { getLocale, getTranslations } from "next-intl/server";
import { AlertCircle, ArrowDown, ArrowUp, CircleDollarSign, CreditCard, ExternalLink, RefreshCcw, WalletCards } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS, percentChange } from "@/src/domain/entities/Analytics";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { Icon } from "@/src/presentation/design-system";
import { StatSparkline } from "../StatSparkline";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import type { PaymentReportWire } from "./payment-report-response-schema";
import { PaymentTrendChart } from "./PaymentTrendChart";

type PaymentSummaryScreenProps = {
  report: PaymentReportWire;
  customers: CustomerOrderSummary[];
  from: string;
  to: string;
  isCustomRange: boolean;
};

export async function PaymentSummaryScreen({ report, customers, from, to, isCustomRange }: PaymentSummaryScreenProps) {
  const t = await getTranslations("dashPaymentReport");
  const tAnalytics = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const customerById = new Map(customers.map((customer) => [customer.userId, customer]));
  const totalSources = report.totals.walletAmount + report.totals.externalAmount;
  const walletShare = totalSources > 0 ? report.totals.walletAmount / totalSources : 0;
  const previousSources = report.previousTotals.walletAmount + report.previousTotals.externalAmount;
  const previousWalletShare = previousSources > 0 ? report.previousTotals.walletAmount / previousSources : 0;
  const sources = [
    { label: t("externalPayments"), amount: report.totals.externalAmount, color: "var(--color-primary)" },
    { label: t("wallet"), amount: report.totals.walletAmount, color: "var(--color-chart-2)" },
  ];
  const sourceStops = donutStops(sources);

  const metrics = [
    { key: "revenue", label: t("paidRevenue"), value: formatMoney(report.totals.paidRevenue, locale), icon: CircleDollarSign, tone: "bg-accent text-primary", color: "var(--color-primary)", delta: percentChange(report.totals.paidRevenue, report.previousTotals.paidRevenue), values: report.series.map((point) => point.revenue) },
    { key: "successful", label: t("successfulPayments"), value: formatNumber(report.totals.successfulPayments, locale), icon: CreditCard, tone: "bg-info text-info-foreground", color: "var(--color-chart-2)", delta: percentChange(report.totals.successfulPayments, report.previousTotals.successfulPayments), values: report.series.map((point) => point.orders) },
    { key: "failed", label: t("failedPayments"), value: formatNumber(report.totals.failedPayments, locale), icon: AlertCircle, tone: "bg-error text-destructive", color: "var(--color-destructive)", delta: percentChange(report.totals.failedPayments, report.previousTotals.failedPayments), inverse: true, values: [report.previousTotals.failedPayments, report.totals.failedPayments] },
    { key: "wallet", label: t("walletShare"), value: formatPercent(walletShare, locale), icon: WalletCards, tone: "bg-warning text-warning-foreground", color: "var(--color-chart-4)", delta: previousSources > 0 ? walletShare - previousWalletShare : null, values: [previousWalletShare, walletShare] },
  ];

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-2 text-body-b10 text-muted-foreground" aria-label={t("breadcrumbAria")}><Link href="/dashboard/reports" className="hover:text-primary">{t("reports")}</Link><span>/</span><span>{t("heading")}</span></nav>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-body-b8 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker presetLabel={tAnalytics("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: tAnalytics(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: tAnalytics("presetCustom") }]} fromLabel={tAnalytics("rangeFrom")} toLabel={tAnalytics("rangeTo")} from={from} to={to} isCustom={isCustomRange} />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8">{tAnalytics("comparisonPeriod", { from: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(report.previousRange.from)), to: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(report.previousRange.to)) })}</div>
          <AnalyticsExportMenu label={tAnalytics("exportHeading")} reports={[{ resource: "orders", label: tAnalytics("exportOrdersReport") }, { resource: "customers", label: tAnalytics("exportCustomersReport") }]} />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <article key={metric.key} className="flex min-h-36 flex-col rounded-card-lg border border-border bg-background p-4"><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full ${metric.tone}`}><Icon icon={metric.icon} size="sm" /></span><div><p className="text-body-b10 text-muted-foreground">{metric.label}</p><p className="text-heading-h3">{metric.value}</p></div></div><MetricDelta value={metric.delta} inverse={metric.inverse} locale={locale} label={t("vsPreviousPeriod")} /><div className="mt-auto"><StatSparkline values={metric.values} color={metric.color} heightClassName="h-7" /></div></article>)}
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,1fr)]">
        <PaymentTrendChart points={report.series} previousPoints={report.previousSeries} granularity={report.granularity} range={report.range} previousRange={report.previousRange} />
        <section className="min-w-0 rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("sourceBreakdown")}</h2><div className="mt-4 flex min-w-0 flex-col items-center gap-6 sm:flex-row"><div className="flex size-32 shrink-0 items-center justify-center rounded-full sm:size-36" style={{ background: `conic-gradient(${sourceStops})` }}><div className="flex size-20 flex-col items-center justify-center rounded-full bg-background sm:size-24"><strong className="text-heading-h2">100%</strong><span className="text-body-b10 text-muted-foreground">{formatMoney(totalSources, locale)}</span></div></div><dl className="w-full min-w-0 flex-1 space-y-4">{sources.map((source) => <div key={source.label} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-body-b8"><span className="size-2 rounded-full" style={{ background: source.color }} /><dt className="truncate">{source.label}</dt><dd className="whitespace-nowrap text-end"><strong>{formatPercent(totalSources > 0 ? source.amount / totalSources : 0, locale)}</strong><span className="ms-3 text-muted-foreground">{formatMoney(source.amount, locale)}</span></dd></div>)}</dl></div></section>
      </div>

      <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("statusSummary")}</h2><div className="mt-3 grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse"><SummaryItem icon={AlertCircle} tone="bg-warning text-warning-foreground" label={t("pendingPayments")} value={formatNumber(report.totals.pendingPayments, locale)} /><SummaryItem icon={RefreshCcw} tone="bg-error text-destructive" label={t("refundedPayments")} value={formatNumber(report.totals.refundedPayments, locale)} /><SummaryItem icon={WalletCards} tone="bg-info text-info-foreground" label={t("walletApplied")} value={formatMoney(report.totals.walletAmount, locale)} /></div></section>

      <section className="rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><h2 className="text-body-b5">{t("recentIssues")}</h2><Link href="/dashboard/orders?payment=failed" className="inline-flex items-center gap-1 text-body-b10 text-primary hover:underline">{t("viewAll")}<Icon icon={ExternalLink} size="xs" /></Link></div>{report.issues.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[48rem] text-body-b10"><thead className="bg-surface-sunken text-muted-foreground"><tr><th className="px-3 py-2 text-start">{t("order")}</th><th className="px-3 py-2 text-start">{t("customer")}</th><th className="px-3 py-2 text-start">{t("reason")}</th><th className="px-3 py-2 text-end">{t("amount")}</th><th className="px-3 py-2 text-start">{t("status")}</th><th className="px-3 py-2 text-start">{t("date")}</th></tr></thead><tbody className="divide-y divide-border">{report.issues.map((issue) => <tr key={issue.orderId}><td className="px-3 py-2"><Link href={`/dashboard/orders/${issue.orderId}`} className="font-mono text-primary">#{issue.orderNumber}</Link></td><td className="px-3 py-2">{customerById.get(issue.userId)?.name ?? issue.userId}</td><td className="px-3 py-2 text-muted-foreground">{t(issue.status === "failed" ? "paymentFailedReason" : "paymentRefundedReason")}</td><td className="px-3 py-2 text-end">{formatMoney(issue.amount, locale)}</td><td className="px-3 py-2"><span className={issue.status === "failed" ? "rounded-pill bg-error px-2 py-1 text-destructive" : "rounded-pill bg-warning px-2 py-1 text-warning-foreground"}>{t(issue.status)}</span></td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatOrderDateShort(issue.placedAt, locale)} · {formatOrderTime(issue.placedAt, locale)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-body-b8 text-muted-foreground">{t("noIssues")}</p>}</section>
    </div>
  );
}

function MetricDelta({ value, inverse = false, locale, label }: { value: number | null; inverse?: boolean; locale: Locale; label: string }) { if (value === null) return <p className="mt-2 text-body-b10 text-muted-foreground">{label}</p>; const percent = value * 100; const favorable = inverse ? percent <= 0 : percent >= 0; return <p className="mt-2 flex items-center gap-1 text-body-b10"><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" className={favorable ? "text-success-foreground" : "text-destructive"} /><strong className={favorable ? "text-success-foreground" : "text-destructive"}>{new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(percent)}%</strong><span className="text-muted-foreground">{label}</span></p>; }
function SummaryItem({ icon, tone, label, value }: { icon: typeof AlertCircle; tone: string; label: string; value: string }) { return <div className="flex items-center gap-3 px-4 py-3 first:ps-0"><span className={`flex size-10 items-center justify-center rounded-full ${tone}`}><Icon icon={icon} size="sm" /></span><div><p className="text-body-b10 text-muted-foreground">{label}</p><strong className="text-heading-h3">{value}</strong></div></div>; }
function formatPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
function donutStops(items: { amount: number; color: string }[]): string { const total = items.reduce((sum, item) => sum + item.amount, 0); if (!total) return "var(--color-muted) 0 100%"; let cursor = 0; return items.map((item) => { const start = cursor; cursor += item.amount / total * 100; return `${item.color} ${start}% ${cursor}%`; }).join(", "); }
