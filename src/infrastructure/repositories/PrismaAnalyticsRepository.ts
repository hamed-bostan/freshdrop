import { Prisma } from "@prisma/client";

import {
  makeTotals,
  previousPeriod,
  storeDateString,
  STORE_TIME_ZONE,
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
import type { CustomerGrowthPoint, PurchaseFrequency, RetentionCohort } from "@/src/domain/entities/CustomerInsightsReport";
import type { CustomerSegmentAssignment, CustomerSegmentId, CustomerSegmentPerformance, CustomerSegmentTransition } from "@/src/domain/entities/CustomerSegmentsReport";
import type { DeliveryPerformancePoint, DeliveryPerformanceTotals, LateDelivery } from "@/src/domain/entities/DeliveryPerformanceReport";
import type { DeliveryZonePerformance } from "@/src/domain/entities/DeliveryZonesReport";
import type { DriverPerformance } from "@/src/domain/entities/DriverPerformance";
import { ORDER_STATUSES, type OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type { PaymentIssue, PaymentReportTotals } from "@/src/domain/entities/PaymentReport";
import type { RefundKind } from "@/src/domain/entities/Refund";
import type { RefundCase, RefundReasonCount, RefundReportTotals, ReturnBreakdown } from "@/src/domain/entities/RefundReport";
import { RETURN_ITEM_CONDITIONS, RETURN_RECOVERY_DECISIONS, type ReturnItemCondition, type ReturnRecoveryDecision, type ReturnRequestStatus } from "@/src/domain/entities/Return";
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
 * `placed_at` (and every other instant column here) is stored as a naive
 * timestamp holding a UTC instant. Bucketing with a bare `date_trunc` would
 * therefore close the trading day at UTC midnight, three and a half hours before
 * the store's actual local midnight — every `date_trunc` below instead goes
 * through {@link zonedTrunc}, which truncates in `Analytics.STORE_TIME_ZONE` and
 * converts back to the same UTC-instant-as-naive-timestamp shape every other
 * column uses, so the result stays directly comparable to `placed_at`. One
 * setting, imported from the domain and applied here and in `startOfUtcDay` /
 * `presetRange` — not one layer quietly picking its own.
 *
 * ## Money precision
 *
 * Every money column this class reads (`orders.total`/`subtotal`/`discount`,
 * `refunds.amount`, `refund_lines.amount`, …) is `Decimal(12,2)` (phase 9) —
 * exact base-10 arithmetic in Postgres, not float8. The `::double precision`
 * casts below stay, but they now do only one job: converting the *finished*
 * aggregate to a plain JS number for `$queryRaw` to hand back (Prisma returns
 * `Decimal` instances for a raw `numeric` column, which would leak
 * `Prisma.Decimal` through `IAnalyticsRepository`'s `number`-typed ports and
 * break `JSON.stringify` on every report route). The arithmetic itself —
 * `SUM`, subtraction, discount pro-rating — runs entirely in `numeric` before
 * that cast is applied, so it inherits the same exactness the columns now
 * have; float8 only ever sees the already-summed total, and a 64-bit float
 * losslessly represents any store-scale money figure to far more than 2
 * decimal places. Casting bare `::numeric` back to the client instead was
 * considered and rejected: it would return `Decimal`/string values across
 * every report endpoint for no precision gain over this narrower cast.
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
        //
        // Measured rather than assumed (phase 8 hardening): a cold `PrismaClient`'s
        // first query alone took ~2.1s against the dev database — already past
        // Prisma's 2s `maxWait` default, which is what actually justifies widening
        // it rather than the query cost. `GetAnalyticsOverview.execute` (ten
        // aggregates, this repository's heaviest `snapshot` caller) ran 25-70ms
        // warm, across every range preset. That's on a 54-order dev dataset, not
        // production scale, so it confirms the cold-start assumption and rules out
        // these numbers being *too tight* — it can't rule out a production-scale
        // table eventually needing more, which is a real measurement nobody has,
        // not a guess to make from here. Left as-is rather than tightened: shrinking
        // a timeout on the strength of a demo dataset would be exactly the kind of
        // unmeasured change this comment exists to warn against.
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
          ${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)},
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket                                                   AS bucket,
        COALESCE(SUM(r.revenue), 0)::double precision              AS revenue,
        COUNT(r.id) FILTER (WHERE r.revenue > 0)::int              AS orders
      FROM buckets b
      LEFT JOIN recognized r ON ${zonedTrunc(unit, Prisma.sql`r.placed_at`)} = b.bucket
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
          ${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)},
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
        ON ${zonedTrunc(unit, Prisma.sql`r.placed_at + (${shiftMs} * interval '1 millisecond')`)} = b.bucket
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
          ${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)},
          ${range.to}::timestamp - interval '1 microsecond',
          '1 ${unit}'::interval
        ) AS bucket
      )
      SELECT
        b.bucket AS bucket,
        COALESCE(SUM(r.revenue) FILTER (WHERE r.payment_status = 'paid'), 0)::double precision AS revenue,
        COUNT(r.id) FILTER (WHERE r.payment_status = 'paid')::int AS orders
      FROM buckets b
      LEFT JOIN recognized r ON ${zonedTrunc(unit, Prisma.sql`r.placed_at`)} = b.bucket
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
          ${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)},
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
        ON ${zonedTrunc(unit, Prisma.sql`r.placed_at + (${shiftMs} * interval '1 millisecond')`)} = b.bucket
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
      WITH period_orders AS (
        SELECT o.id, EXISTS (SELECT 1 FROM refunds r2 WHERE r2.order_id = o.id) AS refunded
        FROM orders o
        WHERE o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      ),
      lines AS (
        SELECT refund_id, SUM(amount)::double precision AS "merchandiseAmount", SUM(COALESCE(quantity, 0))::int AS units
        FROM refund_lines
        GROUP BY refund_id
      )
      SELECT
        COALESCE(SUM(r.amount), 0)::double precision AS "refundedAmount",
        -- Merchandise-only value (excludes tax/shipping baked into refunds.amount).
        COALESCE(SUM(lines."merchandiseAmount") FILTER (WHERE r.kind = 'return'), 0)::double precision AS "recoverableValue",
        COUNT(*)::int AS "refundActivity",
        COALESCE(SUM(lines.units), 0)::int AS "returnedItems",
        COUNT(DISTINCT r.order_id) FILTER (WHERE r.kind = 'cancellation')::int AS "cancelledOrders",
        (SELECT COUNT(*)::int FROM orders o WHERE o.status = 'return_requested' AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}) AS "requestedReturns",
        COUNT(DISTINCT r.order_id) FILTER (WHERE r.kind = 'return')::int AS "returnedOrders",
        (SELECT COUNT(*)::int FROM period_orders) AS "ordersInPeriod",
        -- Orders *placed* in the period that were ever refunded (any refund, any time) ÷ orders placed —
        -- bounded 0-1 by construction, unlike refundActivity / ordersInPeriod which mixes cohorts.
        COALESCE(
          (SELECT COUNT(*) FILTER (WHERE refunded) FROM period_orders)::double precision
            / NULLIF((SELECT COUNT(*) FROM period_orders), 0),
          0
        )::double precision AS "orderCohortRefundRate",
        (
          SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (rr.resolved_at - rr.requested_at)) / 60), 0)::double precision
          FROM return_requests rr
          WHERE rr.resolved_at IS NOT NULL AND rr.requested_at >= ${range.from} AND rr.requested_at < ${range.to}
        ) AS "averageProcessingMinutes"
      FROM refunds r
      LEFT JOIN lines ON lines.refund_id = r.id
      WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
    `);
    return rows[0] ?? emptyRefundTotals();
  }

  async refundSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<RevenuePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const rows = await this.db.$queryRaw<SeriesRow[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)}, ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket
      )
      SELECT b.bucket, COALESCE(SUM(r.amount), 0)::double precision AS revenue, COUNT(r.id)::int AS orders
      FROM buckets b
      LEFT JOIN refunds r ON ${zonedTrunc(unit, Prisma.sql`r.created_at`)} = b.bucket
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
        SELECT generate_series(${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)}, ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket
      )
      SELECT b.bucket, COALESCE(SUM(r.amount), 0)::double precision AS revenue, COUNT(r.id)::int AS orders
      FROM buckets b
      LEFT JOIN refunds r ON ${zonedTrunc(unit, Prisma.sql`r.created_at + (${shiftMs} * interval '1 millisecond')`)} = b.bucket
        AND r.created_at >= ${compareRange.from} AND r.created_at < ${compareRange.to}
      GROUP BY b.bucket
      ORDER BY b.bucket
    `);
    return rows.map(toRevenuePoint);
  }

  async refundReasons(range: DateRange, limit: number): Promise<RefundReasonCount[]> {
    // `refunds.reason` is never written for the guarded flows (`CancelOrder`,
    // `ResolveOrderReturn.approve`) — the customer's actual reason for a return
    // lives on `ReturnRequest.reason` instead, so a return-kind refund is
    // matched back to the resolved request it paid out (same order, most
    // recently resolved) to recover it. Falls back to `r.kind` only when
    // neither exists, same as before.
    const rows = await this.db.$queryRaw<RefundReasonRow[]>(Prisma.sql`
      SELECT COALESCE(NULLIF(TRIM(CASE WHEN r.kind = 'return' THEN rr.reason ELSE r.reason END), ''), r.kind) AS reason,
        r.kind, COUNT(*)::int AS refunds, SUM(r.amount)::double precision AS amount
      FROM refunds r
      LEFT JOIN LATERAL (
        SELECT rrq.reason
        FROM return_requests rrq
        WHERE rrq.order_id = r.order_id AND rrq.status = 'resolved'
        ORDER BY rrq.resolved_at DESC
        LIMIT 1
      ) rr ON r.kind = 'return'
      WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
      GROUP BY COALESCE(NULLIF(TRIM(CASE WHEN r.kind = 'return' THEN rr.reason ELSE r.reason END), ''), r.kind), r.kind
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
          r.created_at AS "activityAt",
          retinfo.status AS "returnStatus", retinfo.condition, retinfo.recovery_decision AS "recoveryDecision"
        FROM refunds r
        JOIN orders o ON o.id = r.order_id
        LEFT JOIN LATERAL (
          SELECT oi.name, oi.image_url
          FROM refund_lines rl JOIN order_items oi ON oi.id = rl.order_item_id
          WHERE rl.refund_id = r.id ORDER BY rl.id LIMIT 1
        ) product ON TRUE
        -- The ReturnRequest this refund paid out, for a return-kind refund --
        -- matched by order since a refund carries no direct reference to it.
        LEFT JOIN LATERAL (
          SELECT rr.status, ri.condition, ri.recovery_decision
          FROM return_requests rr
          JOIN return_items ri ON ri.return_request_id = rr.id
          WHERE rr.order_id = r.order_id AND r.kind = 'return' AND rr.status = 'resolved'
          ORDER BY rr.resolved_at DESC, ri.id
          LIMIT 1
        ) retinfo ON TRUE
        WHERE r.created_at >= ${range.from} AND r.created_at < ${range.to}
        UNION ALL
        SELECT o.id, o.id, o.order_number, o.user_id, COALESCE(oi.name, fallback.name), COALESCE(oi.image_url, fallback.image_url),
          rr.reason, NULL,
          0::double precision, 'return_requested', o.updated_at,
          rr.status, ri.condition, ri.recovery_decision
        FROM orders o
        LEFT JOIN LATERAL (
          SELECT rrq.id, rrq.status, rrq.reason
          FROM return_requests rrq WHERE rrq.order_id = o.id
          ORDER BY rrq.requested_at DESC LIMIT 1
        ) rr ON TRUE
        LEFT JOIN LATERAL (
          SELECT riq.condition, riq.recovery_decision, riq.order_item_id
          FROM return_items riq WHERE riq.return_request_id = rr.id
          ORDER BY riq.id LIMIT 1
        ) ri ON TRUE
        LEFT JOIN order_items oi ON oi.id = ri.order_item_id
        -- Orders that reached return_requested with no ReturnRequest row --
        -- only possible for data from before this model existed.
        LEFT JOIN LATERAL (SELECT oi2.name, oi2.image_url FROM order_items oi2 WHERE oi2.order_id = o.id ORDER BY oi2.position LIMIT 1) fallback ON TRUE
        WHERE o.status = 'return_requested' AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      )
      SELECT * FROM cases ORDER BY "activityAt" DESC LIMIT ${Math.max(1, Math.min(limit, 20))}
    `);
    return rows.map((row) => ({
      ...row,
      kind: row.kind as RefundKind | null,
      status: row.status as RefundCase["status"],
      activityAt: row.activityAt.toISOString(),
      returnStatus: row.returnStatus as ReturnRequestStatus | null,
      condition: row.condition as ReturnItemCondition | null,
      recoveryDecision: row.recoveryDecision as ReturnRecoveryDecision | null,
    }));
  }

  async returnBreakdown(range: DateRange): Promise<ReturnBreakdown> {
    const [conditionRows, outcomeRows] = await Promise.all([
      this.db.$queryRaw<{ condition: string | null; count: number }[]>(Prisma.sql`
        SELECT ri.condition, COUNT(*)::int AS count
        FROM return_items ri
        JOIN return_requests rr ON rr.id = ri.return_request_id
        WHERE rr.requested_at >= ${range.from} AND rr.requested_at < ${range.to}
        GROUP BY ri.condition
      `),
      this.db.$queryRaw<{ decision: string | null; count: number }[]>(Prisma.sql`
        SELECT ri.recovery_decision AS decision, COUNT(*)::int AS count
        FROM return_items ri
        JOIN return_requests rr ON rr.id = ri.return_request_id
        WHERE rr.requested_at >= ${range.from} AND rr.requested_at < ${range.to}
        GROUP BY ri.recovery_decision
      `),
    ]);
    // Gap-fill every known bucket (including "not inspected", `null`) to 0 so
    // the panel's layout doesn't shift depending on which conditions happened
    // to occur in the period.
    const conditionCounts = new Map(conditionRows.map((row) => [row.condition, row.count]));
    const outcomeCounts = new Map(outcomeRows.map((row) => [row.decision, row.count]));
    return {
      conditions: [...RETURN_ITEM_CONDITIONS, null].map((condition) => ({ condition, count: conditionCounts.get(condition) ?? 0 })),
      outcomes: [...RETURN_RECOVERY_DECISIONS, null].map((decision) => ({ decision, count: outcomeCounts.get(decision) ?? 0 })),
    };
  }

  async deliveryTotals(range: DateRange): Promise<DeliveryPerformanceTotals> {
    const rows = await this.db.$queryRaw<DeliveryTotalsRow[]>(Prisma.sql`SELECT COUNT(*)::int AS "deliveredOrders", COUNT(*) FILTER (WHERE due_at IS NOT NULL AND delivered_at <= due_at)::int AS "onTimeOrders", COUNT(*) FILTER (WHERE due_at IS NOT NULL AND delivered_at > due_at)::int AS "lateDeliveries", COALESCE(ROUND(AVG(fulfillment_minutes)), 0)::int AS "averageFulfillmentMinutes" FROM (${deliveryEvents(range)}) deliveries`);
    return rows[0] ?? { deliveredOrders: 0, onTimeOrders: 0, lateDeliveries: 0, averageFulfillmentMinutes: 0 };
  }

  async deliverySeries(range: DateRange, granularity: AnalyticsGranularity): Promise<DeliveryPerformancePoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const rows = await this.db.$queryRaw<DeliveryPointRow[]>(Prisma.sql`WITH buckets AS (SELECT generate_series(${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)}, ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket), deliveries AS (${deliveryEvents(range)}) SELECT b.bucket, COUNT(d.order_id)::int AS "deliveredOrders", COALESCE(COUNT(d.order_id) FILTER (WHERE d.due_at IS NOT NULL AND d.delivered_at <= d.due_at)::double precision / NULLIF(COUNT(d.order_id) FILTER (WHERE d.due_at IS NOT NULL), 0), 0) AS "onTimeRate", COALESCE(ROUND(AVG(d.fulfillment_minutes)), 0)::int AS "averageFulfillmentMinutes" FROM buckets b LEFT JOIN deliveries d ON ${zonedTrunc(unit, Prisma.sql`d.delivered_at`)} = b.bucket GROUP BY b.bucket ORDER BY b.bucket`);
    return rows.map((row) => ({ ...row, bucket: row.bucket.toISOString() }));
  }

  async lateDeliveries(range: DateRange, limit: number): Promise<LateDelivery[]> {
    const rows = await this.db.$queryRaw<LateDeliveryRow[]>(Prisma.sql`SELECT order_id AS "orderId", order_number AS "orderNumber", user_id AS "userId", COALESCE(window_label, 'Unscheduled') AS "windowLabel", GREATEST(0, ROUND(EXTRACT(EPOCH FROM (delivered_at - due_at)) / 60))::int AS "delayMinutes", delivered_at AS "deliveredAt", COALESCE(city, 'Unspecified') AS zone FROM (${deliveryEvents(range)}) deliveries WHERE due_at IS NOT NULL AND delivered_at > due_at ORDER BY delivered_at DESC LIMIT ${Math.max(1, Math.min(limit, 20))}`);
    return rows.map((row) => ({ ...row, deliveredAt: row.deliveredAt.toISOString() }));
  }

  /**
   * Delivery performance grouped by the settlement (city) the order was
   * delivered to — the real geographic dimension, snapshotted onto `orders.city`
   * at checkout (see the `add_order_city` migration). Orders whose city wasn't
   * resolved at checkout (legacy rows, or an unresolved geocode) group under
   * `Unspecified` rather than being dropped, so the totals still reconcile with
   * {@link deliveryTotals}. `centroid` is the average of the group's delivery
   * coordinates — the only real position a city name affords — for a zone map
   * marker; `null` when none of the group's orders carry a coordinate.
   */
  async deliveryZonePerformance(range: DateRange, previousRange: DateRange, limit: number): Promise<DeliveryZonePerformance[]> {
    const rows = await this.db.$queryRaw<DeliveryZonePerformanceRow[]>(Prisma.sql`
      WITH
        current_deliveries AS (${deliveryEvents(range)}),
        previous_deliveries AS (${deliveryEvents(previousRange)}),
        current_stats AS (
          SELECT
            COALESCE(city, 'Unspecified') AS zone,
            COUNT(*)::int AS orders,
            COALESCE(
              COUNT(*) FILTER (WHERE due_at IS NOT NULL AND delivered_at <= due_at)::double precision
                / NULLIF(COUNT(*) FILTER (WHERE due_at IS NOT NULL), 0),
              0
            ) AS "onTimeRate",
            COUNT(*) FILTER (WHERE due_at IS NOT NULL AND delivered_at > due_at)::int AS "lateDeliveries",
            COALESCE(ROUND(AVG(fulfillment_minutes)), 0)::int AS "averageFulfillmentMinutes",
            AVG(destination_lat) AS "centroidLat",
            AVG(destination_lng) AS "centroidLng"
          FROM current_deliveries
          GROUP BY 1
        ),
        previous_stats AS (
          SELECT
            COALESCE(city, 'Unspecified') AS zone,
            COUNT(*)::int AS orders,
            COUNT(*) FILTER (WHERE due_at IS NOT NULL AND delivered_at <= due_at)::double precision
              / NULLIF(COUNT(*) FILTER (WHERE due_at IS NOT NULL), 0) AS rate
          FROM previous_deliveries
          GROUP BY 1
        )
      SELECT
        c.zone,
        c.orders,
        c."onTimeRate",
        c."lateDeliveries",
        c."averageFulfillmentMinutes",
        c."centroidLat",
        c."centroidLng",
        p.rate AS "previousOnTimeRate",
        p.orders AS "previousOrders"
      FROM current_stats c
      LEFT JOIN previous_stats p USING (zone)
      ORDER BY c.orders DESC
      LIMIT ${Math.max(1, Math.min(limit, 20))}
    `);
    return rows.map((row) => ({
      zone: row.zone,
      orders: row.orders,
      onTimeRate: row.onTimeRate,
      previousOnTimeRate: row.previousOnTimeRate,
      previousOrders: row.previousOrders,
      lateDeliveries: row.lateDeliveries,
      averageFulfillmentMinutes: row.averageFulfillmentMinutes,
      centroid: row.centroidLat != null && row.centroidLng != null ? { latitude: row.centroidLat, longitude: row.centroidLng } : null,
    }));
  }

  /**
   * Delivery performance grouped by the driver assigned on the order (`Order.driverId`),
   * ranked by completed-delivery volume. Inner-joined to `drivers`: an order with no
   * driver assigned contributes to {@link deliveryTotals} but can't be attributed to
   * anyone here, so it's silently excluded rather than surfacing as a fake "Unassigned"
   * driver row.
   */
  async driverPerformance(range: DateRange, limit: number): Promise<DriverPerformance[]> {
    const rows = await this.db.$queryRaw<DriverPerformanceRow[]>(Prisma.sql`
      SELECT
        d.id AS "driverId",
        d.name,
        COUNT(*)::int AS "completedDeliveries",
        COALESCE(
          COUNT(*) FILTER (WHERE deliveries.due_at IS NOT NULL AND deliveries.delivered_at <= deliveries.due_at)::double precision
            / NULLIF(COUNT(*) FILTER (WHERE deliveries.due_at IS NOT NULL), 0),
          0
        ) AS "onTimeRate",
        d.rating AS "averageRating"
      FROM (${deliveryEvents(range)}) deliveries
      JOIN drivers d ON d.id = deliveries.driver_id
      GROUP BY d.id, d.name, d.rating
      ORDER BY "completedDeliveries" DESC
      LIMIT ${Math.max(1, Math.min(limit, 20))}
    `);
    return rows;
  }

  async topProducts(range: DateRange, limit: number, sort: RevenueRankSort, comparisonRange?: DateRange): Promise<TopProduct[]> {
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
        COUNT(DISTINCT l.order_id)::int                         AS orders,
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

    if (!comparisonRange || rows.length === 0) return rows.map((row) => ({ ...row, previousRevenue: 0 }));
    const previousRows = await this.db.$queryRaw<{ productId: string; revenue: number }[]>(Prisma.sql`
      WITH ${earningLines(comparisonRange)}
      SELECT l.product_id AS "productId", SUM(l.revenue)::double precision AS revenue
      FROM lines l
      WHERE l.product_id IN (${Prisma.join(rows.map((row) => row.productId))})
      GROUP BY l.product_id
    `);
    const previousByProduct = new Map(previousRows.map((row) => [row.productId, row.revenue]));
    return rows.map((row) => ({ ...row, previousRevenue: previousByProduct.get(row.productId) ?? 0 }));
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

  async customerGrowthSeries(range: DateRange, granularity: AnalyticsGranularity): Promise<CustomerGrowthPoint[]> {
    const unit = Prisma.raw(assertGranularity(granularity));
    const rows = await this.db.$queryRaw<CustomerGrowthRow[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(${zonedTrunc(unit, Prisma.sql`${range.from}::timestamp`)}, ${range.to}::timestamp - interval '1 microsecond', '1 ${unit}'::interval) AS bucket
      ), range_customers AS (
        SELECT DISTINCT o.user_id FROM orders o
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      ), first_orders AS (
        SELECT o.user_id, MIN(o.placed_at) AS first_order_at FROM orders o
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.user_id IN (SELECT user_id FROM range_customers)
        GROUP BY o.user_id
      ), period_orders AS (
        SELECT o.user_id, o.placed_at, o.total - COALESCE(refunds.amount, 0) AS revenue, f.first_order_at
        FROM orders o JOIN first_orders f ON f.user_id = o.user_id
        LEFT JOIN (SELECT order_id, SUM(amount) AS amount FROM refunds GROUP BY order_id) refunds ON refunds.order_id = o.id
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      )
      SELECT b.bucket,
        COUNT(DISTINCT p.user_id) FILTER (WHERE ${zonedTrunc(unit, Prisma.sql`p.first_order_at`)} = b.bucket)::int AS "newCustomers",
        COUNT(DISTINCT p.user_id) FILTER (WHERE ${zonedTrunc(unit, Prisma.sql`p.first_order_at`)} < b.bucket)::int AS "returningCustomers",
        COALESCE(SUM(p.revenue) FILTER (WHERE ${zonedTrunc(unit, Prisma.sql`p.first_order_at`)} = b.bucket), 0)::double precision AS "newRevenue",
        COALESCE(SUM(p.revenue) FILTER (WHERE ${zonedTrunc(unit, Prisma.sql`p.first_order_at`)} < b.bucket), 0)::double precision AS "returningRevenue"
      FROM buckets b LEFT JOIN period_orders p ON ${zonedTrunc(unit, Prisma.sql`p.placed_at`)} = b.bucket
      GROUP BY b.bucket ORDER BY b.bucket
    `);
    return rows.map((row) => ({ ...row, bucket: row.bucket.toISOString() }));
  }

  async purchaseFrequency(range: DateRange): Promise<PurchaseFrequency> {
    const rows = await this.db.$queryRaw<PurchaseFrequencyRow[]>(Prisma.sql`
      WITH period_orders AS (
        SELECT o.user_id, o.placed_at,
          LAG(o.placed_at) OVER (PARTITION BY o.user_id ORDER BY o.placed_at) AS previous_at
        FROM orders o
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.placed_at >= ${range.from} AND o.placed_at < ${range.to}
      ), customer_counts AS (
        SELECT user_id, COUNT(*)::int AS orders FROM period_orders GROUP BY user_id
      ), cadence AS (
        SELECT AVG(EXTRACT(EPOCH FROM (placed_at - previous_at)) / 86400)::double precision AS days
        FROM period_orders WHERE previous_at IS NOT NULL
      )
      SELECT COUNT(*) FILTER (WHERE orders = 1)::int AS "oneOrder",
        COUNT(*) FILTER (WHERE orders BETWEEN 2 AND 3)::int AS "twoToThreeOrders",
        COUNT(*) FILTER (WHERE orders BETWEEN 4 AND 6)::int AS "fourToSixOrders",
        COUNT(*) FILTER (WHERE orders >= 7)::int AS "sevenPlusOrders",
        COALESCE(AVG(orders), 0)::double precision AS "averageOrders",
        (SELECT days FROM cadence) AS "averageDaysBetweenOrders"
      FROM customer_counts
    `);
    return rows[0] ?? { oneOrder: 0, twoToThreeOrders: 0, fourToSixOrders: 0, sevenPlusOrders: 0, averageOrders: 0, averageDaysBetweenOrders: null };
  }

  async retentionCohorts(range: DateRange, limit: number): Promise<RetentionCohort[]> {
    const safeLimit = Math.max(1, Math.min(limit, 12));
    const rows = await this.db.$queryRaw<RetentionCohortRow[]>(Prisma.sql`
      WITH customer_months AS (
        SELECT DISTINCT o.user_id, ${zonedTrunc(Prisma.raw("month"), Prisma.sql`o.placed_at`)} AS activity_month
        FROM orders o WHERE o.status NOT IN ('cancelled', 'refunded')
      ), first_months AS (
        SELECT user_id, MIN(activity_month) AS cohort FROM customer_months GROUP BY user_id
      ), selected_cohorts AS (
        SELECT DISTINCT cohort FROM first_months
        WHERE cohort < ${zonedTrunc(Prisma.raw("month"), Prisma.sql`${range.to}::timestamp`)}
        ORDER BY cohort DESC LIMIT ${safeLimit}
      ), selected AS (
        SELECT f.* FROM first_months f JOIN selected_cohorts c ON c.cohort = f.cohort
      ), activity AS (
        SELECT s.user_id, s.cohort,
          ((EXTRACT(YEAR FROM c.activity_month) - EXTRACT(YEAR FROM s.cohort)) * 12 + EXTRACT(MONTH FROM c.activity_month) - EXTRACT(MONTH FROM s.cohort))::int AS month_index
        FROM selected s JOIN customer_months c ON c.user_id = s.user_id
      )
      SELECT a.cohort, COUNT(DISTINCT a.user_id)::int AS customers,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 0)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month0,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 1)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month1,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 2)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month2,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 3)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month3,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 4)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month4,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.month_index = 5)::double precision / NULLIF(COUNT(DISTINCT a.user_id), 0) AS month5
      FROM activity a GROUP BY a.cohort ORDER BY a.cohort ASC
    `);
    return rows.map((row) => ({ cohort: row.cohort.toISOString(), customers: row.customers, retention: [row.month0, row.month1, row.month2, row.month3, row.month4, row.month5] }));
  }

  async customerSegmentPerformance(range: DateRange): Promise<CustomerSegmentPerformance[]> {
    const inactivityBoundary = previousPeriod(range).from;
    const rows = await this.db.$queryRaw<CustomerSegmentPerformanceRow[]>(Prisma.sql`
      WITH refunds_by_order AS (
        SELECT order_id, SUM(amount) AS amount FROM refunds GROUP BY order_id
      ), recognized AS (
        SELECT o.user_id, o.placed_at, GREATEST(o.total - COALESCE(r.amount, 0), 0) AS revenue
        FROM orders o LEFT JOIN refunds_by_order r ON r.order_id = o.id
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.placed_at < ${range.to}
      ), stats AS (
        SELECT user_id, COUNT(*)::int AS lifetime_orders, SUM(revenue)::double precision AS lifetime_revenue,
          MIN(placed_at) AS first_order, MAX(placed_at) AS last_order,
          MAX(placed_at) FILTER (WHERE placed_at < ${range.from}) AS previous_order,
          COUNT(*) FILTER (WHERE placed_at >= ${range.from})::int AS period_orders,
          COALESCE(SUM(revenue) FILTER (WHERE placed_at >= ${range.from}), 0)::double precision AS period_revenue
        FROM recognized GROUP BY user_id
      ), threshold AS (
        SELECT COALESCE(percentile_cont(0.75) WITHIN GROUP (ORDER BY lifetime_revenue), 0)::double precision AS high_value FROM stats
      ), classified AS (
        SELECT s.*,
          CASE
            WHEN first_order >= ${range.from} THEN 'new_customers'
            WHEN last_order < ${inactivityBoundary} THEN 'dormant'
            WHEN last_order < ${range.from} THEN 'at_risk'
            WHEN previous_order IS NOT NULL AND previous_order < ${inactivityBoundary} THEN 'reactivated'
            WHEN lifetime_orders >= 3 AND lifetime_revenue >= t.high_value THEN 'high_value_loyal'
            ELSE 'repeat_buyers'
          END AS segment
        FROM stats s CROSS JOIN threshold t
      )
      SELECT segment AS id, COUNT(*)::int AS customers,
        COALESCE(SUM(period_revenue), 0)::double precision AS revenue,
        COALESCE(SUM(period_orders), 0)::int AS orders,
        COUNT(*) FILTER (WHERE lifetime_orders > 1)::int AS "repeatCustomers"
      FROM classified GROUP BY segment
    `);
    return rows.map((row) => ({ ...row, id: row.id as CustomerSegmentId }));
  }

  async customerSegmentAssignments(range: DateRange): Promise<CustomerSegmentAssignment[]> {
    const inactivityBoundary = previousPeriod(range).from;
    const rows = await this.db.$queryRaw<CustomerSegmentAssignmentRow[]>(Prisma.sql`
      WITH refunds_by_order AS (
        SELECT order_id, SUM(amount) AS amount FROM refunds GROUP BY order_id
      ), recognized AS (
        SELECT o.user_id, o.placed_at, GREATEST(o.total - COALESCE(r.amount, 0), 0) AS revenue
        FROM orders o LEFT JOIN refunds_by_order r ON r.order_id = o.id
        WHERE o.status NOT IN ('cancelled', 'refunded') AND o.placed_at < ${range.to}
      ), stats AS (
        SELECT user_id, COUNT(*)::int AS lifetime_orders, SUM(revenue)::double precision AS lifetime_revenue,
          MIN(placed_at) AS first_order, MAX(placed_at) AS last_order,
          MAX(placed_at) FILTER (WHERE placed_at < ${range.from}) AS previous_order,
          COUNT(*) FILTER (WHERE placed_at >= ${range.from})::int AS period_orders,
          COALESCE(SUM(revenue) FILTER (WHERE placed_at >= ${range.from}), 0)::double precision AS period_revenue
        FROM recognized GROUP BY user_id
      ), threshold AS (
        SELECT COALESCE(percentile_cont(0.75) WITHIN GROUP (ORDER BY lifetime_revenue), 0)::double precision AS high_value FROM stats
      )
      -- The same restatement of classifyCustomerSegment as customerSegmentPerformance,
      -- kept per-user here instead of aggregated by segment.
      SELECT s.user_id AS "userId",
        CASE
          WHEN first_order >= ${range.from} THEN 'new_customers'
          WHEN last_order < ${inactivityBoundary} THEN 'dormant'
          WHEN last_order < ${range.from} THEN 'at_risk'
          WHEN previous_order IS NOT NULL AND previous_order < ${inactivityBoundary} THEN 'reactivated'
          WHEN lifetime_orders >= 3 AND lifetime_revenue >= t.high_value THEN 'high_value_loyal'
          ELSE 'repeat_buyers'
        END AS segment,
        period_orders AS orders, period_revenue AS revenue
      FROM stats s CROSS JOIN threshold t
    `);
    return rows.map((row) => ({ ...row, segment: row.segment as CustomerSegmentId }));
  }

  async customerSegmentTransitions(range: DateRange): Promise<CustomerSegmentTransition[]> {
    // `captured_on` is a plain DATE holding the snapshot's *local* calendar day
    // (see `storeDateString`, which is how `SnapshotCustomerSegments` labels
    // each row). Casting `range.from::date` in SQL would instead truncate the
    // UTC instant in whatever timezone the connection happens to run in — not
    // necessarily `STORE_TIME_ZONE` — so the boundary is computed here, the same
    // way the snapshot label itself is, and bound as a date literal.
    const startDate = storeDateString(range.from);
    const endDate = storeDateString(range.to);
    const rows = await this.db.$queryRaw<CustomerSegmentTransitionRow[]>(Prisma.sql`
      WITH start_snap AS (
        SELECT DISTINCT ON (user_id) user_id, segment FROM customer_segment_snapshots
        WHERE captured_on <= ${startDate}::date ORDER BY user_id, captured_on DESC
      ), end_snap AS (
        SELECT DISTINCT ON (user_id) user_id, segment FROM customer_segment_snapshots
        WHERE captured_on <= ${endDate}::date ORDER BY user_id, captured_on DESC
      )
      SELECT s.segment AS "fromSegment", e.segment AS "toSegment", COUNT(*)::int AS customers
      FROM end_snap e LEFT JOIN start_snap s ON s.user_id = e.user_id
      GROUP BY s.segment, e.segment
    `);
    return rows.map((row) => ({ ...row, fromSegment: row.fromSegment as CustomerSegmentId | null, toSegment: row.toSegment as CustomerSegmentId }));
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
        oi.order_id,
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
 * `date_trunc('${unit}', …)`, but truncating in `STORE_TIME_ZONE` rather than UTC
 * — see the class doc's "Time zone" section. `ts` must be a naive timestamp
 * holding a UTC instant (every instant column in this schema is); the result is
 * the same shape, so it stays directly comparable to `placed_at`/`created_at` and
 * usable as a `GROUP BY`/join key against them.
 *
 * `unit` is a raw SQL fragment (see `assertGranularity`), not a bound value —
 * this function just forwards it into the two `date_trunc` calls the round trip
 * needs.
 */
function zonedTrunc(unit: Prisma.Sql, ts: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`(date_trunc('${unit}', (${ts}) AT TIME ZONE 'UTC' AT TIME ZONE ${STORE_TIME_ZONE}) AT TIME ZONE ${STORE_TIME_ZONE} AT TIME ZONE 'UTC')`;
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
type CustomerGrowthRow = Omit<CustomerGrowthPoint, "bucket"> & { bucket: Date };
type PurchaseFrequencyRow = PurchaseFrequency;
type RetentionCohortRow = { cohort: Date; customers: number; month0: number; month1: number; month2: number; month3: number; month4: number; month5: number };
type CustomerSegmentPerformanceRow = Omit<CustomerSegmentPerformance, "id"> & { id: string };
type CustomerSegmentAssignmentRow = Omit<CustomerSegmentAssignment, "segment"> & { segment: string };
type CustomerSegmentTransitionRow = Omit<CustomerSegmentTransition, "fromSegment" | "toSegment"> & { fromSegment: string | null; toSegment: string };
type PaymentTotalsRow = PaymentReportTotals;
type PaymentIssueRow = Omit<PaymentIssue, "placedAt"> & { placedAt: Date };
type RefundTotalsRow = RefundReportTotals;
type RefundReasonRow = Omit<RefundReasonCount, "kind"> & { kind: string };
type RefundCaseRow = Omit<RefundCase, "kind" | "status" | "activityAt" | "returnStatus" | "condition" | "recoveryDecision"> & { kind: string | null; status: string; activityAt: Date; returnStatus: string | null; condition: string | null; recoveryDecision: string | null };
type DeliveryTotalsRow = DeliveryPerformanceTotals;
type DeliveryPointRow = Omit<DeliveryPerformancePoint, "bucket"> & { bucket: Date };
type LateDeliveryRow = Omit<LateDelivery, "deliveredAt"> & { deliveredAt: Date };
type DeliveryZonePerformanceRow = { zone: string; orders: number; onTimeRate: number; lateDeliveries: number; averageFulfillmentMinutes: number; centroidLat: number | null; centroidLng: number | null; previousOnTimeRate: number | null; previousOrders: number | null };
type DriverPerformanceRow = DriverPerformance;

function emptyPaymentTotals(): PaymentReportTotals {
  return { paidRevenue: 0, successfulPayments: 0, failedPayments: 0, pendingPayments: 0, refundedPayments: 0, walletAmount: 0, externalAmount: 0 };
}

function emptyRefundTotals(): RefundReportTotals { return { refundedAmount: 0, recoverableValue: 0, refundActivity: 0, returnedItems: 0, cancelledOrders: 0, requestedReturns: 0, returnedOrders: 0, ordersInPeriod: 0, orderCohortRefundRate: 0, averageProcessingMinutes: 0 }; }
function toRevenuePoint(row: SeriesRow): RevenuePoint { return { bucket: row.bucket.toISOString(), revenue: row.revenue, orders: row.orders }; }

/**
 * `delivered_at` is the first `order_status_events` row that moved the order
 * to `completed` — a recorded fact, immutable once written (see
 * `OrderStatusEvent`) — rather than `orders.updated_at`, which any later edit
 * to the row (a note added, a stage correction) would silently move,
 * quietly rewriting delivery history. `fulfillment_minutes` is the actual
 * elapsed time from placement to that event, not the booked slot's width —
 * every order in a window used to average to the same constant regardless of
 * how long it actually took.
 *
 * An order reaching `completed` before this table existed still reads
 * correctly: the introducing migration backfilled one event per order from
 * `updated_at`, so every `completed` order has at least one row here.
 */
function deliveryEvents(range: DateRange): Prisma.Sql {
  return Prisma.sql`SELECT o.id AS order_id, o.order_number, o.user_id, o.driver_id, o.placed_at, e.delivered_at, o.delivery_window_id AS window_id, o.delivery_window AS window_label, o.city, o.destination_lat, o.destination_lng, ROUND(EXTRACT(EPOCH FROM (e.delivered_at - o.placed_at)) / 60)::int AS fulfillment_minutes, CASE WHEN o.delivery_date IS NOT NULL AND w.end_minutes IS NOT NULL THEN o.delivery_date::date + (w.end_minutes * interval '1 minute') ELSE NULL END AS due_at FROM orders o LEFT JOIN delivery_windows w ON w.id = o.delivery_window_id LEFT JOIN LATERAL (SELECT MIN(occurred_at) AS delivered_at FROM order_status_events ev WHERE ev.order_id = o.id AND ev.to_status = 'completed') e ON TRUE WHERE o.delivery_type = 'delivery' AND o.status = 'completed' AND e.delivered_at >= ${range.from} AND e.delivered_at < ${range.to}`;
}
