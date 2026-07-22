import type {
  AnalyticsGranularity,
  AnalyticsTotals,
  DateRange,
  OrderStatusCount,
  RevenuePoint,
  TopCategory,
  TopProduct,
} from "../entities/Analytics";

/**
 * Read access to the store's aggregates.
 *
 * A port of its own rather than more methods on `IOrderRepository`, because it
 * promises something categorically different. `IOrderRepository` deals in orders —
 * entities you can read, show and write back. Nothing here returns an order. Every
 * method returns a *number that was computed where the rows live*, and the whole
 * point of the port is that the rows never travel: the adapter answers each of
 * these with one aggregate query, so the cost is a `GROUP BY` on an indexed range
 * instead of serialising the order history into the app to reduce it in JS.
 *
 * That was the old overview's shape — `GET /api/admin/orders/all` fetched every
 * order, with its items, over HTTP, so the screen could `.filter().reduce()` four
 * numbers out of it. It produced the right answers on a demo dataset and gets
 * slower with every sale, which is the failure mode you only notice once it is
 * expensive to fix. Aggregates are the one thing a database is unambiguously
 * better at than the application in front of it.
 *
 * Read-only, and there is no write anywhere on it: everything here is *derived*
 * from orders, items and the catalog. A stored, incrementally-updated metrics
 * table would be a second source of truth that can silently disagree with the
 * orders it summarises — worth having only once the query cost demands it, and
 * then as a cache built from these queries, not as a replacement for them.
 *
 * Every method takes the same half-open `range`, and the *caller* decides what it
 * is (see `presetRange` / `previousPeriod`). None of them reads a clock, so a
 * comparison between two periods is two calls with two ranges rather than a
 * "previous" flag each adapter would have to interpret the same way.
 */
export type IAnalyticsRepository = {
  /**
   * The headline figures for `range` — revenue, earning orders, units and distinct
   * customers. The same call answers the current period and its baseline; the
   * use-case makes it twice with two ranges.
   */
  totals(range: DateRange): Promise<AnalyticsTotals>;

  /**
   * Revenue and order count per bucket across `range`, oldest first.
   *
   * Gap-filled by the adapter: buckets with no orders come back as zeroes rather
   * than as missing rows. A chart that plots only the days that had sales draws a
   * flat line through a quiet week and reads as steady trade — the absence is the
   * signal, so producing it is the query's job, not the renderer's.
   */
  revenueSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]>;

  /**
   * How orders placed in `range` ended up — one row per status that occurred.
   *
   * Counts *every* status, unlike {@link totals}, which counts only orders that
   * earned money. That difference is the point of the breakdown: cancellations and
   * refunds are invisible in a revenue figure by construction, and they are
   * exactly what someone asking "why was last month worse" needs to see.
   */
  statusBreakdown(range: DateRange): Promise<OrderStatusCount[]>;

  /**
   * The `limit` products that earned the most in `range`.
   *
   * Ranked by revenue rather than units: a case of water outsells everything by
   * volume and rarely pays for the shelf. Line revenue is net of the order's
   * discount, pro-rated the same way a partial refund is (see
   * `refundForLineValue`), so a product's contribution reflects what was actually
   * collected for it.
   */
  topProducts(range: DateRange, limit: number): Promise<TopProduct[]>;

  /** The `limit` categories that earned the most in `range`, measured the same way. */
  topCategories(range: DateRange, limit: number): Promise<TopCategory[]>;
};
