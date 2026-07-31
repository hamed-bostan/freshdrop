import type {
  AnalyticsGranularity,
  AnalyticsTotals,
  CustomerSegments,
  DateRange,
  OrderStateCount,
  OrderStatusCount,
  RevenuePoint,
  RevenueRankSort,
  TopCategory,
  TopProduct,
} from "../entities/Analytics";
import type { PaymentIssue, PaymentReportTotals } from "../entities/PaymentReport";

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
 * Every method that measures a *period* takes the same half-open `range`, and the
 * *caller* decides what it is (see `presetRange` / `previousPeriod`). None of them
 * reads a clock, so a comparison between two periods is two calls with two ranges
 * rather than a "previous" flag each adapter would have to interpret the same way.
 * {@link orderStateCounts} is the one exception, and says why.
 */
export type IAnalyticsRepository = {
  /**
   * Run several of the reads below as one consistent, single-connection batch.
   *
   * Two problems, one answer — and the connection one is not a micro-optimisation.
   * The overview needs ten aggregates at once, and issued as ten independent
   * queries they each take a pool connection and hold it. The dashboard page also
   * fans out to four other endpoints in parallel, every one of which opens an
   * interactive transaction for its `listPage`, and those have two seconds to
   * acquire a connection before Prisma gives up with `P2028`. Ten concurrent
   * aggregates was enough to starve them: the overview rendered and the lists
   * around it returned 500s. Inside one transaction the queries queue on a single
   * connection instead, so the whole overview costs the pool exactly one.
   *
   * The second problem is that the numbers should agree. Read independently, the
   * KPI totals and the chart beside them can be computed either side of an order
   * landing — a chart whose bars don't add up to the tile above it, intermittently
   * and unreproducibly. One transaction at `RepeatableRead` gives them all one
   * snapshot (Postgres' default READ COMMITTED would not — it re-snapshots per
   * statement).
   *
   * Shaped as a combinator rather than folded into one `overview()` method, the
   * same choice {@link IUnitOfWork} makes: the five reads below stay a vocabulary
   * a caller can use singly, and "these ones belong together" stays something the
   * caller states rather than something the port hard-codes.
   */
  snapshot<T>(work: (analytics: IAnalyticsRepository) => Promise<T>): Promise<T>;

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
   * `revenueSeries(range, granularity)`'s buckets, revalued against a different
   * period — the revenue chart's "compare with" series (the immediately preceding
   * period, or the same days a year earlier; see `previousPeriod` /
   * `previousYearRange`).
   *
   * Returned index-aligned to `range`'s own buckets rather than bucketed
   * independently by `compareRange`'s calendar dates: entry `i` is "whatever
   * `compareRange` earned during the window `range`'s bucket `i` would occupy if
   * shifted back onto `compareRange`", not "`compareRange`'s own `i`-th calendar
   * bucket". The two are usually the same count, but not guaranteed to be —
   * `date_trunc('month', …)` on two 365-day windows a year apart can legitimately
   * split into 12 months on one side and 13 on the other. Aligning by construction
   * means the chart can zip the two arrays by position and never has to reconcile
   * mismatched lengths or re-derive which bucket pairs with which.
   */
  compareRevenueSeries(
    range: DateRange,
    compareRange: DateRange,
    granularity: AnalyticsGranularity,
  ): Promise<RevenuePoint[]>;

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
   * The `limit` products that ranked highest in `range` by `sort`.
   *
   * Defaults to revenue rather than units: a case of water outsells everything
   * by volume and rarely pays for the shelf. Line revenue is net of the order's
   * discount, pro-rated the same way a partial refund is (see
   * `refundForLineValue`), so a product's contribution reflects what was
   * actually collected for it. Sorting by `units` instead is what surfaces that
   * same case of water — the two orders disagree in exactly the interesting
   * cases, which is why the panel lets the reader flip between them rather than
   * only ever showing one.
   */
  topProducts(range: DateRange, limit: number, sort: RevenueRankSort): Promise<TopProduct[]>;

  /** The `limit` categories that ranked highest in `range` by `sort`, measured the same way. */
  topCategories(range: DateRange, limit: number, sort: RevenueRankSort): Promise<TopCategory[]>;

  /**
   * How `range`'s customers split by purchase history — see `CustomerSegments`.
   *
   * Scoped to customers who ordered *in* `range`, but their "new" / "returning"
   * / "repeat" status is judged against their whole order history, not just
   * this window — the same reason `orderStateCounts` ignores a range for a
   * different question. A customer's first-ever order might have landed months
   * before `range` even opened; this is the query that has to look back far
   * enough to know that.
   */
  customerSegments(range: DateRange): Promise<CustomerSegments>;

  /**
   * How many orders are in each `(status, stage)` pair right now — one `GROUP BY`
   * behind every count the order list shows: its four summary cards and the number
   * beside each option in its status filter.
   *
   * The only method here that takes no range, and the exception is the point:
   * everything else answers "what happened in a period", while this answers "what
   * is waiting". An order confirmed in March is still waiting today, so bounding
   * it by a period would quietly under-report the queue — which is the one number
   * a card like this must never do.
   *
   * Returns only the pairs that exist. Absent means zero; the domain fills the
   * gaps (see `pipelineCounts`).
   */
  orderStateCounts(): Promise<OrderStateCount[]>;

  /** Aggregate payment outcomes and funding sources for one reporting period. */
  paymentTotals(range: DateRange): Promise<PaymentReportTotals>;

  /** Gap-filled paid-revenue series for the payment report. */
  paymentSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]>;

  /** Paid-revenue comparison series aligned to the current report's buckets. */
  comparePaymentSeries(range: DateRange, compareRange: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]>;

  /** Latest failed or refunded payments in the period, bounded for the report table. */
  paymentIssues(range: DateRange, limit: number): Promise<PaymentIssue[]>;
};
