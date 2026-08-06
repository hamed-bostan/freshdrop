import { Clock3, TimerOff, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

export async function DeliveryMetricGrid({ report, locale }: { report: DeliveryPerformanceWire; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  const rate = report.totals.deliveredOrders ? report.totals.onTimeOrders / report.totals.deliveredOrders : 0;
  const previousRate = report.previousTotals.deliveredOrders ? report.previousTotals.onTimeOrders / report.previousTotals.deliveredOrders : 0;
  const metrics = [
    { label: t("onTimeRate"), value: formatPercent(rate, locale), icon: Clock3, tone: "green" as const, delta: previousRate ? (rate - previousRate) / previousRate : null, values: report.series.map((point) => point.onTimeRate) },
    { label: t("averageDeliveryTime"), value: t("compactMinutes", { value: formatNumber(report.totals.averageFulfillmentMinutes, locale) }), icon: Clock3, tone: "blue" as const, delta: percentChange(report.totals.averageFulfillmentMinutes, report.previousTotals.averageFulfillmentMinutes), values: report.series.map((point) => point.averageFulfillmentMinutes), inverse: true },
    { label: t("lateDeliveries"), value: formatNumber(report.totals.lateDeliveries, locale), icon: TimerOff, tone: "orange" as const, delta: percentChange(report.totals.lateDeliveries, report.previousTotals.lateDeliveries), values: [report.previousTotals.lateDeliveries, report.totals.lateDeliveries], inverse: true },
    { label: t("deliveredOrdersReference"), value: formatNumber(report.totals.deliveredOrders, locale), icon: Truck, tone: "green" as const, delta: percentChange(report.totals.deliveredOrders, report.previousTotals.deliveredOrders), values: report.series.map((point) => point.deliveredOrders) },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} currentLabel={t("currentPeriod")} />)}</section>;
}
