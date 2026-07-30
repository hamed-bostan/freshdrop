import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { reviewsServerApi } from "@/src/presentation/dashboard/reviews/review-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { analyticsServerApi } from "@/src/presentation/dashboard/analytics/analytics-server-api";
import {
  PENDING_ORDER_SLA_HOURS,
  UNFULFILLED_ORDER_SLA_HOURS,
  slaCutoff,
} from "@/src/domain/entities/OrderSla";
import { DashboardOverviewScreen } from "@/src/presentation/dashboard/DashboardOverviewScreen";
import {
  buildLowStockQuery,
  buildOrderQueueCountQuery,
  buildRecentOrdersQuery,
  buildReviewCountQuery,
} from "@/src/presentation/dashboard/dashboard-overview-queries";
import {
  hasCustomAnalyticsRange,
  parseAnalyticsRange,
  toDateParam,
  toInclusiveEndParam,
} from "@/src/lib/api/analytics-params";

// The overview is read from the REST API (BFF) per request — never cached.
export const dynamic = "force-dynamic";

type DashboardPageProps = {
  /** The period the picker writes: `range` (a preset) or `from`/`to`. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  );

  // Resolved here as well as in the route handler, and deliberately: the picker's
  // date inputs have to show the period that was actually served, which for a
  // preset (or a malformed param) is not what the query string says. Same parser
  // on both sides, so the two answers cannot disagree.
  const range = parseAnalyticsRange(params);
  // The same instant backs both SLA counts below and the cutoffs handed to the
  // screen for their tiles' `href`s — one `now`, so a count can never be drawn
  // against a slightly later cutoff than the link it sits behind points to.
  const now = new Date();
  const staleOrdersCutoff = slaCutoff(PENDING_ORDER_SLA_HOURS, now).toISOString();
  const overdueOrdersCutoff = slaCutoff(UNFULFILLED_ORDER_SLA_HOURS, now).toISOString();

  // The dashboard layout already gates this tree to admins; the BFF forwards the
  // admin's session cookie so the admin endpoints authorize the calls. Everything
  // is fetched together.
  //
  // No read here touches more than a page of rows. The period KPIs, the chart and
  // both rankings arrive as aggregates computed in the database; pending reviews,
  // low stock and the two order-queue SLA signals arrive as counts from the
  // filtered endpoints; the recent orders are literally the first five. The
  // overview used to start by fetching every order in the store's history — see
  // `IAnalyticsRepository`.
  const [analytics, recentOrders, reviews, needsRestock, staleOrders, overdueOrders] =
    await Promise.all([
      analyticsServerApi.getOverview(params),
      ordersServerApi.listPage(buildRecentOrdersQuery()),
      reviewsServerApi.listPage(buildReviewCountQuery()),
      // One read, not two: `needsRestock` is the products list's own name for "low or
      // out", and it's the filter the tile links into — so the count and the
      // destination are answered by the same query and can't disagree.
      productsServerApi.listPage(buildLowStockQuery()),
      // Orders still `pending` (unconfirmed) placed before the cutoff — the order
      // list's own `pipeline` + `to` (placed-before) filters, so this reuses the
      // existing endpoint rather than adding a new one.
      ordersServerApi.listPage(buildOrderQueueCountQuery("pending", staleOrdersCutoff)),
      // Any order still in flight (`in_progress` spans every live milestone)
      // placed before the wider cutoff — "hasn't arrived in a day", whichever
      // stage it's stuck at.
      ordersServerApi.listPage(buildOrderQueueCountQuery("in_progress", overdueOrdersCutoff)),
    ]);

  // Labels for the recent-orders list, fetched for those orders' own customers.
  // Same pattern as the orders list page: a page of orders needs at most that
  // many customers.
  const recentOrderCustomers = await customersServerApi.listByIds([
    ...new Set(recentOrders.items.map((order) => order.userId)),
  ]);

  return (
    <DashboardOverviewScreen
      analytics={analytics}
      from={toDateParam(range.from)}
      // The stored end is exclusive (midnight the next day); the picker shows the
      // last day the period actually includes.
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      recentOrders={recentOrders.items}
      recentOrderCustomers={recentOrderCustomers.items}
      pendingReviews={reviews.counts.pending}
      lowStockCount={needsRestock.total}
      lowStockProducts={needsRestock.items}
      staleOrdersCount={staleOrders.total}
      staleOrdersCutoff={staleOrdersCutoff}
      overdueOrdersCount={overdueOrders.total}
      overdueOrdersCutoff={overdueOrdersCutoff}
    />
  );
}
