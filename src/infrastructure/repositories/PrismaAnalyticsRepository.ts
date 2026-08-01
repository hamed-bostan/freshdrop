import { Prisma } from "@prisma/client";
import {
  makeTotals,
  type AnalyticsGranularity,
  type AnalyticsTotals,
  type CustomerSegments,
  type DateRange,
  type OrderStateCount,
  type OrderStatusCount,
  type RevenuePoint,
  type RevenueRankSort,
  type TopCategory,
  type TopProduct,
} from "@/src/domain/entities/Analytics";
import type { PaymentIssue, PaymentReportTotals } from "@/src/domain/entities/PaymentReport";
import type { RefundCase, RefundReasonCount, RefundReportTotals } from "@/src/domain/entities/RefundReport";
import type { RefundKind } from "@/src/domain/entities/Refund";
import { ORDER_STATUSES, type OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type { IAnalyticsRepository } from "@/src/domain/repositories/IAnalyticsRepository";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";

/**
 * Store aggregates computed in PostgreSQL. Server-side only, bound through the
 * container.
 *
 * Raw SQL rather than Prisma's `groupBy`, and deliberately so. Almost every figure
 * here needs one of three things Prisma's query builder cannot express: an
 * expression over two tables (recognized revenue is an order's total minus the
 * refunds on its *items*), `date_trunc` bucketing with the empty buckets filled in,
 * or an aggregate over a computed column. Approximating any of them in the client
 * means fetching the rows — which is the exact cost this class exists to remove.
 *
 * {@link orderStateCounts} is the exception and stays a `groupBy`: it counts two
 * plain columns and needs none of the above, so raw SQL would buy nothing and cost
 * the type safety.
 *
 * ## Recognized revenue, in SQL
 *
 * The definition is the domain's `orderRecognizedRevenue`, restated once in
 * {@link recognizedOrders} and reused by every query below: an order's `total`
 * minus the sum of every `Refund` recorded against it (phase 6 — see
 * `Refund.ts`). Every wallet credit is backed by a ledger row now, cancellation
 * and return included, so there is no separate `cancelled`/`refunded` case here
 * any more: a fully refunded order's ledger already sums to its `total`, which
 * nets to 0 without a special case, exactly mirroring the domain function.
 *
 * Two definitions of one number is the failure this comment exists to flag. If
 * `orderRecognizedRevenue` changes, this CTE changes with it — a divergence would
 * show up as a dashboard that quietly disagrees with the order screens.
 *
 * ## Time zone
 *
 * `placed_at` is stored as a UTC timestamp, and every `date_trunc` below buckets
 * in UTC to match the ranges the domain builds (see `startOfUtcDay`). A store
 * whose trading day should close at local midnight wants a `AT TIME ZONE` here and
 * the same zone in `presetRange` — one setting, applied in both places, not one
 * layer quietly picking its own.
 */
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly db: PrismaDb = prisma) {}

  snapshot<T>(work: (analytics: IAnalyticsRepository) => Promise<T>): Promise<T> {
    return inTransaction(
      this.db,
      // A repository bound to the transaction client, so every read the callback
      // makes queues on that one connection — the same construction
      // `PrismaUnitOfWork` uses to hand out transaction-bound repositories.
      (tx) => work(new PrismaAnalyticsRepository(tx)),
      {
        // What makes the "one moment" claim true; see `TransactionOptions`.
        isolationLevel: "RepeatableRead",
        // Prisma's defaults are 2s to acquire and 5s to run, both sized for a
        // single quick write. This is seven aggregates queued on one connection,
        // and the first request after a cold start pays for connecting too — the
        // defaults turn that into an error rather than a slow page.
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  }

  async totals(range: DateRange): Promise<AnalyticsTotals> {
    const rows = await this.db.$queryRaw<TotalsRow[]>(Prisma.sql`
      WITH ${recognizedOrders(range)}
      SELECT
        COALESCE(SUM(r.revenue), 0)::double precision              AS revenue,
        COUNT(*) FILTER (WHERE r.revenue > 0)::int                 AS orders,
        COUNT(DISTINCT r.user_id) FILTER (WHERE r.revenue > 0)::int AS customers,
        COALESCE((
          -- Units that were actually delivered: quantities on earning orders, minus
          -- the lines a picker refunded (a substituted line still ships, so it counts).
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN recognized e ON e.id = oi.order_id AND e.revenue > 0
          WHERE oi.substitution_status IS DISTINCT FROM 'refunded'
        ), 0)::int                                                  AS units
      FROM recognized r
    `);

    const row = rows[0];
    return makeTotals({
      revenue: row?.revenue ?? 0,
      orders: row?.orders ?? 0,
      units: row?.units ?? 0,
      customers: row?.customers ?? 0,
    });
  }

  async revenueSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]> {
    // Interpolated rather than bound as a parameter: it is a closed union chosen
    // server-side by `granularityFor`, never caller input, and it appears inside an
    // interval literal where a bind would need casts on both sides. Re-validated
    // anyway, because "can't reach here" is a claim that outlives the code proving it.
    const unit = Prisma.raw(assertGranularity(granularity));

    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH ${recognizedOrders(range)},
      -- Every bucket the range covers, including the ones no order fell in. A chart
      -- drawn only from buckets that had sales runs a straight line through a dead
      -- week and reads as steady trade — the gap is the signal.
      buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', ${range.from}::timestamp),
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket                                                   AS bucket,
        COALESCE(SUM(r.revenue), 0)::double precision              AS revenue,
        COUNT(r.id) FILTER (WHERE r.revenue > 0)::int              AS orders
      FROM buckets b
      LEFT JOIN recognized r ON date_trunc('${unit}', r.placed_at) = b.bucket
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);

    return rows.map((row) => ({
      bucket: row.bucket.toISOString(),
      revenue: row.revenue,
      orders: row.orders,
    }));
  }

  async compareRevenueSeries(
    range: DateRange,
    compareRange: DateRange,
    granularity: AnalyticsGranularity,
  ): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));

    // Every order below is read from `compareRange`, but the buckets are `range`'s
    // own — generated exactly as `revenueSeries` generates them, over `range`, not
    // `compareRange`. That's what index-aligns the result to `revenueSeries(range,
    // granularity)`: shifting a `compareRange` order forward by this offset before
    // truncating is what lands it in the bucket its `range`-relative counterpart
    // occupies, rather than in whatever bucket `compareRange`'s own calendar
    // produces (which, per the port doc, isn't guaranteed to even total the same
    // number of buckets).
    const shiftMs = range.from.getTime() - compareRange.from.getTime();

    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH ${recognizedOrders(compareRange)},
      buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', ${range.from}::timestamp),
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket                                                   AS bucket,
        COALESCE(SUM(r.revenue), 0)::double precision              AS revenue,
        COUNT(r.id) FILTER (WHERE r.revenue > 0)::int              AS orders
      FROM buckets b
      LEFT JOIN recognized r
        ON date_trunc('${unit}', r.placed_at + (${shiftMs} * interval '1 millisecond')) = b.bucket
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);

    return rows.map((row) => ({
      bucket: row.bucket.toISOString(),
      revenue: row.revenue,
      orders: row.orders,
    }));
  }

  async statusBreakdown(range: DateRange): Promise<OrderStatusCount[]> {
    const rows = await this.db.$queryRaw<StatusRow[]>(Prisma.sql`
      WITH ${recognizedOrders(range)}
      SELECT
        r.status                                      AS status,
        COUNT(*)::int                                 AS orders,
        COALESCE(SUM(r.revenue), 0)::double precision AS revenue
      FROM recognized r
      GROUP BY r.status
    `);

    // Statuses no order landed in are absent from a GROUP BY, and the breakdown is
    // read as a whole ("how did the period split") — a missing slice would look
    // like a rendering bug rather than a zero. Filled here, in the domain's own
    // order, so the legend is stable between periods.
    const byStatus = new Map(rows.map((row) => [row.status, row]));
    return ORDER_STATUSES.map((status) => ({
      status,
      orders: byStatus.get(status)?.orders ?? 0,
      revenue: byStatus.get(status)?.revenue ?? 0,
    }));
  }

  async orderStateCounts(): Promise<OrderStateCount[]> {
    // Prisma's `groupBy` rather than raw SQL, unlike its neighbours here: they
    // need a CTE to define what "recognized revenue" means, and this needs a plain
    // count over two columns. It scans the whole table by design — there is no
    // range to narrow it to (see the port) — so it's a seq-scan + hash aggregate;
    // no index helps a full-table group-by, and the counts are small enough per
    // request that none needs to. If order volume ever makes this bite, the answer
    // is a summary row updated on write, not an index.
    const rows = await this.db.order.groupBy({
      by: ["status", "stage"],
      _count: { _all: true },
    });

    return rows.map((row) => ({
      // Plain string columns holding the domain unions, narrowed the same way the
      // order mapper does.
      status: row.status as OrderStatus,
      stage: (row.stage as TrackingMilestone | null) ?? null,
      orders: row._count._all,
    }));
  }

  async paymentTotals(range: DateRange): Promise<PaymentReportTotals> {
    const rows = await this.db.$queryRaw<PaymentTotalsRow[]>(Prisma.sql`
      WITH ${recognizedOrders(range)}
      SELECT
        COALESCE(SUM(r.revenue) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS "paidRevenue",
        COUNT(*) FILTER (WHERE r.payment_status = 'paid')::int AS "successfulPayments",
        COUNT(*) FILTER (WHERE r.payment_status = 'failed')::int AS "failedPayments",
        COUNT(*) FILTER (WHERE r.payment_status = 'pending')::int AS "pendingPayments",
        COUNT(*) FILTER (WHERE r.payment_status = 'refunded')::int AS "refundedPayments",
        COALESCE(SUM(LEAST(r.wallet_applied, GREATEST(r.revenue, 0))) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS "walletAmount",
        COALESCE(SUM(GREATEST(r.revenue - r.wallet_applied, 0)) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS "externalAmount"
      FROM recognized r
    `);
    return rows[0] ?? emptyPaymentTotals();
  }

  async paymentSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH ${recognizedOrders(range)},
      buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', ${range.from}::timestamp),
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket AS bucket,
        COALESCE(SUM(r.revenue) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS revenue,
        COUNT(r.id) FILTER (WHERE r.payment_status = 'paid')::int AS orders
      FROM buckets b
      LEFT JOIN recognized r ON date_trunc('${unit}', r.placed_at) = b.bucket
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);
    return rows.map((row) => ({ bucket: row.bucket.toISOString(), revenue: row.revenue, orders: row.orders }));
  }

  async comparePaymentSeries(
    range: DateRange,
    compareRange: DateRange,
    granularity: AnalyticsGranularity,
  ): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const shiftMs = range.from.getTime() - compareRange.from.getTime();
    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH ${recognizedOrders(compareRange)},
      buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', ${range.from}::timestamp),
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket AS bucket,
        COALESCE(SUM(r.revenue) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS revenue,
        COUNT(r.id) FILTER (WHERE r.payment_status = 'paid')::int AS orders
      FROM buckets b
      LEFT JOIN recognized r
        ON date_trunc('${unit}', r.placed_at + (${shiftMs} * interval '1 millisecond')) = b.bucket
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);
    return rows.map((row) => ({ bucket: row.bucket.toISOString(), revenue: row.revenue, orders: row.orders }));
  }

  async paymentIssues(range: DateRange, limit: number): Promise<PaymentIssue[]> {
    const rows = await this.db.$queryRaw<PaymentIssueRow[]>(Prisma.sql`
      SELECT
        o.id AS "orderId",
        o.order_number AS "orderNumber",
        o.user_id AS "userId",
        o.payment_status AS status,
        o.total::double precision AS amount,
        o.placed_at AS "placedAt"
      FROM orders o
      WHERE o.placed_at >= ${range.from}
        AND o.placed_at < ${range.to}
        AND o.payment_status IN ('failed', 'refunded')
      ORDER BY o.placed_at DESC
      LIMIT ${Math.max(1, Math.min(limit, 20))}
    `);
    return rows.map((row) => ({ ...row, placedAt: row.placedAt.toISOString() }));
  }

  async refundTotals(range: DateRange): Promise<RefundReportTotals> {
    const rows = await this.db.$queryRaw<RefundTotalsRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(r.amount), 0)::double precision AS "refundedAmount",
        COUNT(*)::int AS "refundCount",
        COALESCE(SUM(lines.units), 0)::int AS "returnedItems",
        COUNT(*) FILTER (WHERE r.kind = 'cancellation')::int AS "cancelledOrders",
        (SELECT COUNT(*)::int FROM orders o WHERE o.status = 'return_requested' AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}) AS "requestedReturns",
        COUNT(*) FILTER (WHERE r.kind = 'return')::int AS "returnedOrders",
        (SELECT COUNT(*)::int FROM orders o WHERE o.placed_at >= ${range.from} AND o.placed_at < ${range.to}) AS "ordersInPeriod"
      FROM refunds r
      LEFT JOIN (
        SELECT refund_id, SUM(COALESCE(quantity, 0))::int AS units
        FROM refund_lines
        GROUP BY refund_id
      ) lines ON lines.refund_id = r.id
      WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
    `);
    return rows[0] ?? emptyRefundTotals();
  }

  async refundSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(date_trunc('${unit}', ${range.from}::timestamp), ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket
      )
      SELECT b.bucket, COALESCE(SUM(r.amount), 0)::double precision AS revenue, COUNT(r.id)::int AS orders
      FROM buckets b
      LEFT JOIN refunds r ON date_trunc('${unit}', r.created_at) = b.bucket
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);
    return rows.map(toRevenuePoint);
  }

  async compareRefundSeries(range: DateRange, compareRange: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const shiftMs = range.from.getTime() - compareRange.from.getTime();
    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(date_trunc('${unit}', ${range.from}::timestamp), ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket
      )
      SELECT b.bucket, COALESCE(SUM(r.amount), 0)::double precision AS revenue, COUNT(r.id)::int AS orders
      FROM buckets b
      LEFT JOIN refunds r ON date_trunc('${unit}', r.created_at + (${shiftMs} * interval '1 millisecond')) = b.bucket
        AND r.created_at >= ${compareRange.from} AND r.created_at < ${compareRange.to}
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);
    return rows.map(toRevenuePoint);
  }

  async refundReasons(range: DateRange, limit: number): Promise<RefundReasonCount[]> {
    const rows = await this.db.$queryRaw<RefundReasonRow[]>(Prisma.sql`
      SELECT COALESCE(NULLIF(TRIM(r.reason), ''), r.kind) AS reason, r.kind, COUNT(*)::int AS refunds, SUM(r.amount)::double precision AS amount
      FROM refunds r
      WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
      GROUP BY COALESCE(NULLIF(TRIM(r.reason), ''), r.kind), r.kind
      ORDER BY COUNT(*) DESC, SUM(r.amount) DESC
      LIMIT ${Math.max(1, Math.min(limit, 10))}
    `);
    return rows.map((row) => ({ ...row, kind: row.kind as RefundKind }));
  }

  async refundCases(range: DateRange, limit: number): Promise<RefundCase[]> {
    const rows = await this.db.$queryRaw<RefundCaseRow[]>(Prisma.sql`
      WITH cases AS (
        SELECT r.id, o.id AS "orderId", o.order_number AS "orderNumber", o.user_id AS "userId",
          product.name AS "productName", product.image_url AS "productImageUrl", r.reason, r.kind,
          r.amount::double precision AS amount,
          CASE WHEN r.kind = 'cancellation' THEN 'cancelled' ELSE 'refunded' END AS status,
          r.created_at AS "activityAt"
        FROM refunds r
        JOIN orders o ON o.id = r.order_id
        LEFT JOIN LATERAL (
          SELECT oi.name, oi.image_url
          FROM refund_lines rl JOIN order_items oi ON oi.id = rl.order_item_id
          WHERE rl.refund_id = r.id ORDER BY rl.id LIMIT 1
        ) product ON TRUE
        WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
        UNION ALL
        SELECT o.id, o.id, o.order_number, o.user_id, item.name, item.image_url, NULL, NULL,
          0::double precision, 'return_requested', o.updated_at
        FROM orders o
        LEFT JOIN LATERAL (SELECT oi.name, oi.image_url FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.position LIMIT 1) item ON TRUE
        WHERE o.status = 'return_requested' AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      )
      SELECT * FROM cases ORDER BY "activityAt" DESC LIMIT ${Math.max(1, Math.min(limit, 20))}
    `);
    return rows.map((row) => ({ ...row, kind: row.kind as RefundKind | null, status: row.status as RefundCase["status"], activityAt: row.activityAt.toISOString() }));
  }

  async topProducts(range: DateRange, limit: number, sort: RevenueRankSort): Promise<TopProduct[]> {
    const rows = await this.db.$queryRaw<TopProductRow[]>(Prisma.sql`
      WITH ${earningLines(range)}
      SELECT
        l.product_id                                            AS "productId",
        -- The catalog name when the product still exists, the order line's snapshot
        -- when it doesn't: a product deleted last week still earned money last week,
        -- and dropping it from the ranking would overstate everything above it.
        COALESCE(MAX(p.name), MAX(l.name))                      AS name,
        COALESCE(MAX(p.image_url), MAX(l.image_url))            AS "imageUrl",
        SUM(l.quantity)::int                                    AS units,
        SUM(l.revenue)::double precision                        AS revenue
      FROM lines l
      LEFT JOIN products p ON p.id = l.product_id
      GROUP BY l.product_id
      -- The aggregate, spelled out rather than ordering by an output alias: both
      -- candidates ("revenue", "units") name a lines CTE column too, and while
      -- Postgres resolves a bare ORDER BY name to the output column, relying on
      -- that is a silent ranking bug waiting for someone to rename something.
      ORDER BY ${REVENUE_RANK_ORDER[sort]} DESC
      LIMIT ${limit}
    `);

    return rows;
  }

  async topCategories(range: DateRange, limit: number, sort: RevenueRankSort): Promise<TopCategory[]> {
    const rows = await this.db.$queryRaw<TopCategoryRow[]>(Prisma.sql`
      WITH ${earningLines(range)}
      SELECT
        c.id                             AS "categoryId",
        c.name                           AS name,
        SUM(l.quantity)::int             AS units,
        SUM(l.revenue)::double precision AS revenue
      FROM lines l
      -- Inner joins: a line whose product (or whose product's category) is gone has
      -- no category to attribute to. It stays in the product ranking above, where it
      -- can still name itself.
      JOIN products p ON p.id = l.product_id
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY ${REVENUE_RANK_ORDER[sort]} DESC
      LIMIT ${limit}
    `);

    return rows;
  }

  async customerSegments(range: DateRange): Promise<CustomerSegments> {
    const rows = await this.db.$queryRaw<SegmentsRow[]>(Prisma.sql`
      WITH range_customers AS (
        SELECT DISTINCT o.user_id
        FROM orders o
        WHERE o.status NOT IN ('cancelled', 'refunded')
          AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      ),
      -- Lifetime stats for exactly the customers above, not the whole customer
      -- base: restricting the GROUP BY to range_customers first is what keeps
      -- this a lookup on the customers who matter rather than a full scan of
      -- every order the store has ever taken (contrast orderStateCounts, which
      -- has no range to narrow by and pays that cost on purpose).
      lifetime AS (
        SELECT
          o.user_id,
          MIN(o.placed_at) AS first_order_at,
          COUNT(*)::int     AS orders
        FROM orders o
        WHERE o.status NOT IN ('cancelled', 'refunded')
          AND o.user_id IN (SELECT user_id FROM range_customers)
        GROUP BY o.user_id
      )
      SELECT
        COUNT(*)::int                                                  AS "totalCustomers",
        COUNT(*) FILTER (WHERE l.first_order_at >= ${range.from})::int AS "newCustomers",
        COUNT(*) FILTER (WHERE l.first_order_at <  ${range.from})::int AS "returningCustomers",
        COUNT(*) FILTER (WHERE l.orders > 1)::int                      AS "repeatCustomers"
      FROM lifetime l
    `);

    const row = rows[0];
    return {
      totalCustomers: row?.totalCustomers ?? 0,
      newCustomers: row?.newCustomers ?? 0,
      returningCustomers: row?.returningCustomers ?? 0,
      repeatCustomers: row?.repeatCustomers ?? 0,
    };
  }
}

/** The aggregate each {@link RevenueRankSort} orders by — see the callers' comments on why it's spelled out rather than aliased. */
const REVENUE_RANK_ORDER: Record<RevenueRankSort, Prisma.Sql> = {
  revenue: Prisma.sql`SUM(l.revenue)`,
  units: Prisma.sql`SUM(l.quantity)`,
};

/**
 * The `recognized` CTE: one row per order placed in `range`, carrying the revenue
 * the domain recognizes for it. The single restatement of
 * `orderRecognizedRevenue` in SQL — see the class comment.
 *
 * `placed_at >= from AND < to` is the half-open range the domain defines, and it
 * is a sargable predicate on the `orders(placed_at)` index, so the cost scales
 * with the period rather than with the store's history.
 */
function recognizedOrders(range: DateRange): Prisma.Sql {
  return Prisma.sql`
    recognized AS (
      SELECT
        o.id,
        o.user_id,
        o.status,
        o.payment_status,
        o.wallet_applied,
        o.placed_at,
        o.total - COALESCE(refunds.amount, 0) AS revenue
      FROM orders o
      LEFT JOIN (
        SELECT order_id, SUM(amount) AS amount
        FROM refunds
        GROUP BY order_id
      ) refunds ON refunds.order_id = o.id
      WHERE o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
    )
  `;
}

/**
 * The `lines` CTE: every order line in `range` that earned money, with its share of
 * revenue — what the product and category rankings are built from.
 *
 * Line revenue is `quantity × price` net of the order's discount, pro-rated exactly
 * as `orderDiscountRate` / `refundForLineValue` do it: charging a line its sticker
 * price would credit a heavily discounted order with revenue nobody collected. The
 * delivery fee is excluded for the same reason those functions exclude it — it
 * isn't merchandise, so no product earned it.
 *
 * Refunded lines are dropped rather than netted: a line refunded during picking was
 * never delivered, so it sold nothing. Substituted lines stay, at the price
 * originally charged — the customer received *something* for that line, and the
 * saving on a cheaper swap is a wallet credit against the order, not against the
 * product.
 */
function earningLines(range: DateRange): Prisma.Sql {
  return Prisma.sql`
    earning_orders AS (
      SELECT
        o.id,
        -- The share of merchandise value the discount took off, clamped to [0, 1]
        -- for the same reason the domain clamps it: a hand-entered discount larger
        -- than the subtotal must not turn a line's revenue negative.
        LEAST(GREATEST(
          CASE WHEN o.subtotal > 0 THEN o.discount / o.subtotal ELSE 0 END,
        0), 1) AS discount_rate
      FROM orders o
      WHERE o.placed_at >= ${range.from}
        AND o.placed_at < ${range.to}
        AND o.status NOT IN ('cancelled', 'refunded')
    ),
    lines AS (
      SELECT
        oi.product_id,
        oi.name,
        oi.image_url,
        oi.quantity,
        oi.quantity * oi.price * (1 - eo.discount_rate) AS revenue
      FROM order_items oi
      JOIN earning_orders eo ON eo.id = oi.order_id
      WHERE oi.substitution_status IS DISTINCT FROM 'refunded'
    )
  `;
}

const GRANULARITY_UNITS = new Set<AnalyticsGranularity>(["day", "week", "month"]);

/** Guard the one value interpolated into SQL rather than bound. */
function assertGranularity(granularity: AnalyticsGranularity): AnalyticsGranularity {
  if (!GRANULARITY_UNITS.has(granularity)) {
    throw new Error(`Unsupported analytics granularity: ${granularity}`);
  }
  return granularity;
}

/**
 * Row shapes the raw queries return. Explicit because `$queryRaw` cannot infer
 * them: the `::int` / `::double precision` casts in the SQL are what make these
 * plain JS numbers (an uncast `COUNT(*)` arrives as a `BigInt`, which serialises
 * to nothing on the way out through JSON).
 */
type TotalsRow = { revenue: number; orders: number; customers: number; units: number };
type SeriesRow = { bucket: Date; revenue: number; orders: number };
type StatusRow = { status: OrderStatus; orders: number; revenue: number };
type TopProductRow = TopProduct;
type TopCategoryRow = TopCategory;
type SegmentsRow = CustomerSegments;
type PaymentTotalsRow = PaymentReportTotals;
type PaymentIssueRow = Omit<PaymentIssue, "placedAt"> & { placedAt: Date };
type RefundTotalsRow = RefundReportTotals;
type RefundReasonRow = Omit<RefundReasonCount, "kind"> & { kind: string };
type RefundCaseRow = Omit<RefundCase, "kind" | "status" | "activityAt"> & { kind: string | null; status: string; activityAt: Date };

function emptyPaymentTotals(): PaymentReportTotals {
  return { paidRevenue: 0, successfulPayments: 0, failedPayments: 0, pendingPayments: 0, refundedPayments: 0, walletAmount: 0, externalAmount: 0 };
}

function emptyRefundTotals(): RefundReportTotals { return { refundedAmount: 0, refundCount: 0, returnedItems: 0, cancelledOrders: 0, requestedReturns: 0, returnedOrders: 0, ordersInPeriod: 0 }; }
function toRevenuePoint(row: SeriesRow): RevenuePoint { return { bucket: row.bucket.toISOString(), revenue: row.revenue, orders: row.orders }; }
