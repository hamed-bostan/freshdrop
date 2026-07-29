import { percentChange, type AnalyticsOverview, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import type { RevenueRankRow } from "./analytics/RevenueRankPanel";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardKpiModel = {
  current: number;
  trendValues: number[];
  delta?: { percent: number; tone: "up" | "down" | "flat" };
};

function kpi(current: number, previous: number, trendValues: number[]): DashboardKpiModel {
  const change = percentChange(current, previous);
  const percent = change === null ? undefined : Math.round(change * 100);
  return {
    current,
    trendValues,
    delta: percent === undefined
      ? undefined
      : { percent, tone: percent > 0 ? "up" : percent < 0 ? "down" : "flat" },
  };
}

/** Pure presentation mapping: transport data in, render-ready dashboard values out. */
export function buildDashboardOverviewViewModel(analytics: AnalyticsOverview) {
  const { totals, previousTotals } = analytics;
  return {
    comparisonDays: Math.round(
      (new Date(analytics.range.to).getTime() - new Date(analytics.range.from).getTime()) / DAY_MS,
    ),
    revenue: kpi(totals.revenue, previousTotals.revenue, analytics.revenueSeries.map((p) => p.revenue)),
    orders: kpi(totals.orders, previousTotals.orders, analytics.revenueSeries.map((p) => p.orders)),
    averageOrder: kpi(
      totals.averageOrderValue,
      previousTotals.averageOrderValue,
      analytics.revenueSeries.map((p) => p.orders > 0 ? p.revenue / p.orders : 0),
    ),
    newCustomers: kpi(
      analytics.customerSegments.newCustomers,
      analytics.previousCustomerSegments.newCustomers,
      [analytics.previousCustomerSegments.newCustomers, analytics.customerSegments.newCustomers],
    ),
    topProducts: analytics.topProducts.map((product): RevenueRankRow => ({
      id: product.productId,
      label: product.name,
      imageUrl: product.imageUrl,
      units: product.units,
      revenue: product.revenue,
      href: `/dashboard/products?q=${encodeURIComponent(product.name)}`,
    })),
    topCategories: analytics.topCategories.map((category): RevenueRankRow => ({
      id: category.categoryId,
      label: category.name,
      units: category.units,
      revenue: category.revenue,
      href: `/dashboard/products?categoryId=${encodeURIComponent(category.categoryId)}`,
    })),
    rankSortOptions: ["revenue", "units"] satisfies RevenueRankSort[],
  };
}
