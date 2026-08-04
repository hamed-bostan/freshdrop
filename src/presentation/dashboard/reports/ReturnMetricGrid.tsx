import { CircleDollarSign, PackageCheck, SearchCheck, TimerReset } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import type { RefundReportWire } from "./refund-report-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

export async function ReturnMetricGrid({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const open = report.totals.requestedReturns;
  const previousOpen = report.previousTotals.requestedReturns;
  const metrics = [
    { label: t("returnedItems"), value: formatNumber(report.totals.returnedItems, locale), icon: PackageCheck, tone: "purple" as const, delta: percentChange(report.totals.returnedItems, report.previousTotals.returnedItems), values: [report.previousTotals.returnedItems, report.totals.returnedItems], inverse: true },
    { label: t("openRecoveryItems"), value: formatNumber(open, locale), icon: SearchCheck, tone: "orange" as const, delta: percentChange(open, previousOpen), values: [previousOpen, open], inverse: true },
    { label: t("recoveredInventoryValue"), value: formatMoney(report.totals.recoverableValue, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(report.totals.recoverableValue, report.previousTotals.recoverableValue), values: [report.previousTotals.recoverableValue, report.totals.recoverableValue] },
    { label: t("averageProcessingTime"), value: t("processingDays", { days: report.totals.averageProcessingMinutes / (24 * 60) }), icon: TimerReset, tone: "blue" as const, delta: percentChange(report.totals.averageProcessingMinutes, report.previousTotals.averageProcessingMinutes), values: [report.previousTotals.averageProcessingMinutes, report.totals.averageProcessingMinutes], inverse: true },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPreviousPeriod")} currentLabel={t("currentPeriod")} />)}</section>;
}
