import { CircleDollarSign, PackageCheck, RefreshCcw, TimerReset } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import type { RefundReportWire } from "./refund-report-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

export async function ReturnMetricGrid({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const rate = report.totals.ordersInPeriod ? report.totals.returnedOrders / report.totals.ordersInPeriod : 0;
  const previousRate = report.previousTotals.ordersInPeriod ? report.previousTotals.returnedOrders / report.previousTotals.ordersInPeriod : 0;
  const metrics = [
    { label: t("returnedItems"), value: formatNumber(report.totals.returnedItems, locale), icon: PackageCheck, tone: "purple" as const, delta: percentChange(report.totals.returnedItems, report.previousTotals.returnedItems), values: [report.previousTotals.returnedItems, report.totals.returnedItems], inverse: true },
    { label: t("returnRate"), value: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(rate), icon: RefreshCcw, tone: "red" as const, delta: previousRate ? (rate - previousRate) / previousRate : null, values: [previousRate, rate], inverse: true },
    { label: t("refundedValue"), value: formatMoney(report.totals.refundedAmount, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(report.totals.refundedAmount, report.previousTotals.refundedAmount), values: report.series.map((item) => item.revenue), inverse: true },
    { label: t("openRequests"), value: formatNumber(report.totals.requestedReturns, locale), icon: TimerReset, tone: "blue" as const, delta: percentChange(report.totals.requestedReturns, report.previousTotals.requestedReturns), values: [report.previousTotals.requestedReturns, report.totals.requestedReturns], inverse: true },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPreviousPeriod")} currentLabel={t("currentPeriod")} />)}</section>;
}
