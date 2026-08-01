import { Clock3, PackageCheck, TimerOff, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

export async function DeliveryMetricGrid({ report, locale }: { report: DeliveryPerformanceWire; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  const rate = report.totals.deliveredOrders ? report.totals.onTimeOrders / report.totals.deliveredOrders : 0;
  const previousRate = report.previousTotals.deliveredOrders ? report.previousTotals.onTimeOrders / report.previousTotals.deliveredOrders : 0;
  const metrics = [
    { label: t("activeWindows"), value: formatNumber(report.windows.length, locale), icon: Truck, tone: "green" as const, delta: null, values: report.windows.map((window) => window.orders) },
    { label: t("deliveredOrders"), value: formatNumber(report.totals.deliveredOrders, locale), icon: PackageCheck, tone: "blue" as const, delta: percentChange(report.totals.deliveredOrders, report.previousTotals.deliveredOrders), values: report.series.map((point) => point.deliveredOrders) },
    { label: t("onTimeRate"), value: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(rate), icon: Clock3, tone: "green" as const, delta: previousRate ? (rate - previousRate) / previousRate : null, values: report.series.map((point) => point.onTimeRate) },
    { label: t("lateDeliveries"), value: formatNumber(report.totals.lateDeliveries, locale), icon: TimerOff, tone: "orange" as const, delta: percentChange(report.totals.lateDeliveries, report.previousTotals.lateDeliveries), values: [report.previousTotals.lateDeliveries, report.totals.lateDeliveries], inverse: true },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} currentLabel={t("currentPeriod")} />)}</section>;
}
