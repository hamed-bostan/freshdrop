import type { RevenueRankSort } from "@/src/domain/entities/Analytics";

export const DASHBOARD_RECENT_ORDERS_COUNT = 5;
export const DASHBOARD_LOW_STOCK_COUNT = 4;
export const DASHBOARD_RANK_LIMIT = 3;

export function buildDashboardAnalyticsQuery(
  source: URLSearchParams,
  productSort: RevenueRankSort,
  categorySort: RevenueRankSort,
) {
  const params = new URLSearchParams(source);
  params.set("rankLimit", String(DASHBOARD_RANK_LIMIT));
  params.set("productSort", productSort);
  params.set("categorySort", categorySort);
  return params;
}

export function buildRecentOrdersQuery() {
  return new URLSearchParams(`page=1&pageSize=${DASHBOARD_RECENT_ORDERS_COUNT}`);
}

export function buildReviewCountQuery() {
  return new URLSearchParams("page=1&pageSize=1");
}

export function buildLowStockQuery() {
  return new URLSearchParams(
    `page=1&pageSize=${DASHBOARD_LOW_STOCK_COUNT}&stock=needsRestock&sort=stock&dir=asc`,
  );
}

export function buildOrderQueueCountQuery(
  pipeline: "pending" | "in_progress",
  cutoff: string,
) {
  const params = new URLSearchParams("page=1&pageSize=1");
  params.set("pipeline", pipeline);
  params.set("to", cutoff);
  return params;
}
