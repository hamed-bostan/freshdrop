import { AlertTriangle, CircleDollarSign, UserRoundCheck, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

import { SalesMetricCard } from "./SalesMetricCard";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentMetricGrid({ report, locale }: { report: CustomerSegmentsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments");
  const metrics = [
    { label: t("activeSegments"), value: formatNumber(report.activeSegments, locale), icon: UsersRound, tone: "green" as const, delta: null, values: report.segments.map((segment) => segment.customers), currentLabel: t("needAttention", { count: report.attentionSegments }) },
    { label: t("segmentedCustomers"), value: formatNumber(report.segmentedCustomers, locale), icon: UserRoundCheck, tone: "blue" as const, delta: percentChange(report.segmentedCustomers, report.previousSegmentedCustomers), values: [report.previousSegmentedCustomers, report.segmentedCustomers], currentLabel: t("currentPeriod") },
    { label: t("loyalRevenue"), value: formatMoney(report.loyalRevenue, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(report.loyalRevenue, report.previousLoyalRevenue), values: [report.previousLoyalRevenue, report.loyalRevenue], currentLabel: t("currentPeriod") },
    { label: t("atRiskCustomers"), value: formatNumber(report.atRiskCustomers, locale), icon: AlertTriangle, tone: "red" as const, delta: percentChange(report.atRiskCustomers, report.previousAtRiskCustomers), values: [report.previousAtRiskCustomers, report.atRiskCustomers], currentLabel: t("currentPeriod"), inverse: true },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} />)}</section>;
}
