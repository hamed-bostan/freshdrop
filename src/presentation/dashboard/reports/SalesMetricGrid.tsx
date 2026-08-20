import { CircleDollarSign, PackageOpen, Receipt, ShoppingCart } from "lucide-react";

import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { StatCardCarousel } from "@/src/presentation/dashboard/StatCardCarousel";

import { SalesMetricCard } from "./SalesMetricCard";

import type { AnalyticsOverviewWire } from "../analytics/analytics-response-schema";

type SalesMetricGridProps = {
  analytics: AnalyticsOverviewWire;
  locale: Locale;
  labels: { revenue: string; orders: string; averageOrder: string; units: string; comparison: string; current: string };
};

export function SalesMetricGrid({ analytics, locale, labels }: SalesMetricGridProps) {
  const { totals, previousTotals, revenueSeries } = analytics;
  const metrics = [
    { label: labels.revenue, value: formatMoney(totals.revenue, locale), icon: CircleDollarSign, tone: "green" as const, delta: percentChange(totals.revenue, previousTotals.revenue), values: revenueSeries.map((item) => item.revenue) },
    { label: labels.orders, value: formatNumber(totals.orders, locale), icon: ShoppingCart, tone: "blue" as const, delta: percentChange(totals.orders, previousTotals.orders), values: revenueSeries.map((item) => item.orders) },
    { label: labels.averageOrder, value: formatMoney(totals.averageOrderValue, locale), icon: Receipt, tone: "orange" as const, delta: percentChange(totals.averageOrderValue, previousTotals.averageOrderValue), values: revenueSeries.map((item) => item.orders > 0 ? item.revenue / item.orders : 0) },
    { label: labels.units, value: formatNumber(totals.units, locale), icon: PackageOpen, tone: "green" as const, delta: percentChange(totals.units, previousTotals.units), values: [previousTotals.units, totals.units] },
  ];
  const cards = metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={labels.comparison} currentLabel={labels.current} />);

  return <><div className="sm:hidden"><StatCardCarousel>{cards}</StatCardCarousel></div><section className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">{cards}</section></>;
}
