import { CircleDollarSign, PackageCheck, RefreshCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import type { RefundReportWire } from "./refund-report-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

export async function RefundOverviewMetricGrid({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const rate = report.totals.orderCohortRefundRate;
  const previousRate = report.previousTotals.orderCohortRefundRate;
  const metrics = [
    { label: t("refundedAmount"), value: formatMoney(report.totals.refundedAmount, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(report.totals.refundedAmount, report.previousTotals.refundedAmount), values: report.series.map((point) => point.revenue), inverse: true },
    { label: t("refundRate"), value: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(rate), icon: RefreshCcw, tone: "red" as const, delta: percentChange(rate, previousRate), values: [previousRate, rate], inverse: true },
    { label: t("returnedItems"), value: formatNumber(report.totals.returnedItems, locale), icon: PackageCheck, tone: "purple" as const, delta: percentChange(report.totals.returnedItems, report.previousTotals.returnedItems), values: [report.previousTotals.returnedItems, report.totals.returnedItems], inverse: true },
    { label: t("recoverableValue"), value: formatMoney(report.totals.recoverableValue, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(report.totals.recoverableValue, report.previousTotals.recoverableValue), values: [report.previousTotals.recoverableValue, report.totals.recoverableValue] },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPreviousPeriod")} currentLabel={t("currentPeriod")} />)}</section>;
}
