import { CircleDollarSign, Repeat2, UserRoundPlus, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { percentChange, repeatPurchaseRate } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { StatCardCarousel } from "@/src/presentation/dashboard/StatCardCarousel";

import { SalesMetricCard } from "./SalesMetricCard";

import type { CustomerInsightsWire } from "./customer-insights-response-schema";

export async function CustomerMetricGrid({ report, locale }: { report: CustomerInsightsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const repeatRate = repeatPurchaseRate(report.segments) ?? 0;
  const previousRepeatRate = repeatPurchaseRate(report.previousSegments) ?? 0;
  const averageValue = report.segments.totalCustomers ? report.totals.revenue / report.segments.totalCustomers : 0;
  const previousAverageValue = report.previousSegments.totalCustomers ? report.previousTotals.revenue / report.previousSegments.totalCustomers : 0;
  const metrics = [
    { label: t("activeCustomers"), value: formatNumber(report.segments.totalCustomers, locale), icon: UsersRound, tone: "green" as const, delta: percentChange(report.segments.totalCustomers, report.previousSegments.totalCustomers), values: report.growth.map((point) => point.newCustomers + point.returningCustomers) },
    { label: t("newCustomers"), value: formatNumber(report.segments.newCustomers, locale), icon: UserRoundPlus, tone: "blue" as const, delta: percentChange(report.segments.newCustomers, report.previousSegments.newCustomers), values: report.growth.map((point) => point.newCustomers) },
    { label: t("repeatPurchaseRate"), value: formatPercent(repeatRate, locale), icon: Repeat2, tone: "purple" as const, delta: previousRepeatRate ? (repeatRate - previousRepeatRate) / previousRepeatRate : null, values: [previousRepeatRate, repeatRate] },
    { label: t("twelveMonthValue"), value: formatMoney(averageValue, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(averageValue, previousAverageValue), values: report.growth.map((point) => point.newRevenue + point.returningRevenue) },
  ];
  const cards = metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} currentLabel={t("currentPeriod")} className="min-h-[174px] md:min-h-52 xl:min-h-40" />);
  return <><div className="sm:hidden"><StatCardCarousel>{cards}</StatCardCarousel></div><section className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">{cards}</section></>;
}
