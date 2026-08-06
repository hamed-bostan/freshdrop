import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowDown, ArrowUp, CalendarDays, CheckCircle2, CircleDollarSign, CreditCard, ExternalLink, Landmark, Percent } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS, percentChange } from "@/src/domain/entities/Analytics";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { Icon } from "@/src/presentation/design-system";
import { StatSparkline } from "../StatSparkline";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { PaymentIssuesTable } from "./PaymentIssuesTable";
import type { PaymentReportWire } from "./payment-report-response-schema";
import { PaymentTrendChart } from "./PaymentTrendChart";

type Props = { report: PaymentReportWire; customers: CustomerOrderSummary[]; from: string; to: string; isCustomRange: boolean };

export async function PaymentSummaryScreen({ report, customers, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashPaymentReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const customerById = new Map(customers.map((customer) => [customer.userId, customer]));
  const issuesWithCustomerName = report.issues.map((issue) => ({ ...issue, customerName: customerById.get(issue.userId)?.name ?? issue.userId }));
  const gross = report.totals.walletAmount + report.totals.externalAmount;
  const previousGross = report.previousTotals.walletAmount + report.previousTotals.externalAmount;
  const attempts = report.totals.successfulPayments + report.totals.failedPayments;
  const previousAttempts = report.previousTotals.successfulPayments + report.previousTotals.failedPayments;
  const successRate = attempts ? report.totals.successfulPayments / attempts : 0;
  const previousSuccessRate = previousAttempts ? report.previousTotals.successfulPayments / previousAttempts : 0;
  const sources = [{ label: t("cardPayments"), amount: report.totals.externalAmount, color: "var(--color-primary)" }, { label: t("wallet"), amount: report.totals.walletAmount, color: "var(--color-chart-2)" }];
  const metrics = [
    { key: "volume", label: t("grossPaymentVolume"), value: formatMoney(gross, locale), icon: CircleDollarSign, tone: "bg-accent text-primary", color: "var(--color-primary)", delta: percentChange(gross, previousGross), values: report.series.map((point) => point.revenue) },
    { key: "successful", label: t("successfulPayments"), value: formatNumber(report.totals.successfulPayments, locale), icon: CreditCard, tone: "bg-info text-info-foreground", color: "var(--color-chart-2)", delta: percentChange(report.totals.successfulPayments, report.previousTotals.successfulPayments), values: report.series.map((point) => point.orders) },
    { key: "rate", label: t("paymentSuccessRate"), value: formatPercent(successRate, locale), icon: CheckCircle2, tone: "bg-success text-success-foreground", color: "var(--color-primary)", delta: previousAttempts ? successRate - previousSuccessRate : null, points: true, values: [previousSuccessRate, successRate] },
    { key: "failed", label: t("failedPaymentAttempts"), value: formatNumber(report.totals.failedPayments, locale), icon: AlertTriangle, tone: "bg-warning text-warning-foreground", color: "var(--color-chart-4)", delta: percentChange(report.totals.failedPayments, report.previousTotals.failedPayments), inverse: true, values: [report.previousTotals.failedPayments, report.totals.failedPayments] },
  ];

  return <div className="flex flex-col gap-3">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><nav className="mb-1 flex items-center gap-2 text-body-b10 text-muted-foreground" aria-label={t("breadcrumbAria")}><Link href="/dashboard/reports" className="hover:text-primary">{t("reports")}</Link><span>/</span><span>{t("heading")}</span></nav><h1 className="text-heading-h2 text-foreground">{t("heading")}</h1><p className="mt-1 text-body-b8 text-muted-foreground">{t("referenceSubtitle")}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8">{ta("comparisonPeriod", { from: formatMediumDate(report.previousRange.from, locale), to: formatMediumDate(report.previousRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "orders", label: ta("exportOrdersReport") }, { resource: "customers", label: ta("exportCustomersReport") }]} from={from} to={to} /></div></header>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.key} className="flex min-h-36 flex-col rounded-card-lg border border-border bg-background p-4"><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full ${metric.tone}`}><Icon icon={metric.icon} size="sm" /></span><div><p className="text-body-b10 text-muted-foreground">{metric.label}</p><p className="text-heading-h3">{metric.value}</p></div></div><Delta value={metric.delta} inverse={metric.inverse} points={metric.points} locale={locale} label={t("vsPreviousPeriod")} /><div className="mt-auto"><StatSparkline values={metric.values} color={metric.color} heightClassName="h-7" /></div></article>)}</section>

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(24rem,.85fr)]"><PaymentTrendChart points={report.series} previousPoints={report.previousSeries} granularity={report.granularity} range={report.range} previousRange={report.previousRange} /><section className="min-w-0 rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("paymentMethods")}</h2><div className="mt-4 flex min-w-0 flex-col items-center gap-6 sm:flex-row"><div className="flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${donutStops(sources)})` }}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-background"><strong className="text-body-b5">{formatMoney(gross, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("total")}</span></div></div><dl className="w-full min-w-0 flex-1 space-y-4">{sources.map((source) => <div key={source.label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-body-b8"><span className="size-2 rounded-full" style={{ background: source.color }} /><dt className="truncate">{source.label}</dt><dd className="whitespace-nowrap text-end"><strong>{formatPercent(gross ? source.amount / gross : 0, locale)}</strong><span className="ms-3 text-muted-foreground">{formatMoney(source.amount, locale)}</span></dd></div>)}</dl></div></section></div>

    <section className="rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><h2 className="text-body-b5">{t("settlements")}</h2><Link href="/dashboard/reports/exports" className="inline-flex items-center gap-1 text-body-b10 text-primary">{t("viewSettlements")}<Icon icon={ExternalLink} size="xs" /></Link></div><div className="mt-3 grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse"><Summary icon={Landmark} tone="bg-accent text-primary" label={t("pendingPayout")} value={formatMoney(report.totals.externalAmount, locale)} note={t("estimatedPayout")} /><Summary icon={CalendarDays} tone="bg-info text-info-foreground" label={t("lastPayout")} value={formatMoney(report.totals.paidRevenue, locale)} note={t("paidThisPeriod")} /><Summary icon={Percent} tone="bg-muted text-secondary" label={t("processingFees")} value={formatMoney(gross * 0.0232, locale)} note={t("feeShare")} /></div></section>

    <PaymentIssuesTable issues={issuesWithCustomerName} />
  </div>;
}

function Delta({ value, inverse = false, points = false, locale, label }: { value: number | null; inverse?: boolean; points?: boolean; locale: Locale; label: string }) { if (value === null) return <p className="mt-2 text-body-b10 text-muted-foreground">{label}</p>; const percent = value * 100; const good = inverse ? percent <= 0 : percent >= 0; return <p className="mt-2 flex items-center gap-1 text-body-b10"><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" className={good ? "text-success-foreground" : "text-destructive"} /><strong className={good ? "text-success-foreground" : "text-destructive"}>{new Intl.NumberFormat(locale, { signDisplay: "always", maximumFractionDigits: 1 }).format(percent)}{points ? "pp" : "%"}</strong><span className="text-muted-foreground">{label}</span></p>; }
function Summary({ icon, tone, label, value, note }: { icon: typeof AlertTriangle; tone: string; label: string; value: string; note: string }) { return <div className="flex items-center gap-3 px-4 py-3 first:ps-0"><span className={`flex size-10 items-center justify-center rounded-full ${tone}`}><Icon icon={icon} size="sm" /></span><div><p className="text-body-b10 text-muted-foreground">{label}</p><strong className="text-heading-h3">{value}</strong><p className="text-label-l4 text-muted-foreground">{note}</p></div></div>; }
function donutStops(items: { amount: number; color: string }[]): string { const total = items.reduce((sum, item) => sum + item.amount, 0); if (!total) return "var(--color-muted) 0 100%"; let cursor = 0; return items.map((item) => { const start = cursor; cursor += item.amount / total * 100; return `${item.color} ${start}% ${cursor}%`; }).join(", "); }
