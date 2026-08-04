import { Prisma, type PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaAnalyticsRepository } from "../../PrismaAnalyticsRepository";
import { getTestPrisma, resetTestDatabase } from "./test-db";

/**
 * Exercises the hand-written raw SQL in `PrismaAnalyticsRepository` against a
 * real Postgres database — the thing nothing else verifies (every other test
 * of this class mocks `IAnalyticsRepository` entirely; see the seven
 * `GetXReport.test.ts` files). Scoped to the queries the reports-grounding
 * audit singled out: `refundTotals`'s cohort math, delivery on-time
 * measurement against the recorded `completed` event, and the return
 * condition/outcome and segment-transition breakdowns the report panels
 * render straight from.
 *
 * `npm run test:integration` — not part of `npm test`. See
 * `vitest.integration.config.ts`.
 */
describe("PrismaAnalyticsRepository (integration)", () => {
  let prisma: PrismaClient;
  let repo: PrismaAnalyticsRepository;

  beforeEach(async () => {
    prisma = await getTestPrisma();
    await resetTestDatabase(prisma);
    repo = new PrismaAnalyticsRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const RANGE = { from: new Date("2026-07-01T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };

  async function seedUser(id: string): Promise<void> {
    await prisma.user.create({ data: { id, phone: `700${id}`, name: id, role: "customer" } });
  }

  async function seedOrder(input: {
    id: string;
    userId: string;
    placedAt: Date;
    total: number;
    status?: string;
    deliveryType?: string;
  }): Promise<void> {
    await prisma.order.create({
      data: {
        id: input.id,
        userId: input.userId,
        status: input.status ?? "completed",
        phase: "completed",
        deliveryType: input.deliveryType ?? "delivery",
        paymentStatus: "paid",
        placedAt: input.placedAt,
        location: "Test address",
        subtotal: input.total,
        total: input.total,
        shipping: 0,
        discount: 0,
      },
    });
  }

  describe("refundTotals", () => {
    it("counts an order refunded twice once (dedupe), and bounds the cohort rate at 100%", async () => {
      await seedUser("u1");
      // Placed *inside* the period, refunded twice inside it — the exact case the
      // dedupe fix (`COUNT(DISTINCT r.order_id)`) targets.
      await seedOrder({ id: "o1", userId: "u1", placedAt: new Date("2026-07-10T12:00:00.000Z"), total: 100 });
      await prisma.refund.create({ data: { orderId: "o1", userId: "u1", kind: "return", amount: 30, createdAt: new Date("2026-07-11T00:00:00.000Z") } });
      await prisma.refund.create({ data: { orderId: "o1", userId: "u1", kind: "return", amount: 20, createdAt: new Date("2026-07-12T00:00:00.000Z") } });

      // A second order placed in the period, never refunded — pulls the cohort
      // rate below 100% so the test can tell "correct" from "always saturates".
      await seedOrder({ id: "o2", userId: "u1", placedAt: new Date("2026-07-15T00:00:00.000Z"), total: 50 });

      const totals = await repo.refundTotals(RANGE);

      expect(totals.returnedOrders).toBe(1);
      expect(totals.refundActivity).toBe(2);
      expect(totals.refundedAmount).toBeCloseTo(50);
      expect(totals.ordersInPeriod).toBe(2);
      expect(totals.orderCohortRefundRate).toBeCloseTo(0.5);
      expect(totals.orderCohortRefundRate).toBeLessThanOrEqual(1);
    });
  });

  describe("deliveryTotals / delivery on-time math", () => {
    it("measures fulfillment time from placement to the recorded `completed` event, not the booked window's width", async () => {
      await seedUser("u1");
      // Placed at 12:00, marked completed 90 minutes later — fulfillment_minutes
      // must read 90, regardless of any delivery window's own width.
      await seedOrder({ id: "o1", userId: "u1", placedAt: new Date("2026-07-10T12:00:00.000Z"), total: 40 });
      await prisma.orderStatusEvent.create({
        data: { orderId: "o1", toStatus: "completed", occurredAt: new Date("2026-07-10T13:30:00.000Z") },
      });

      const totals = await repo.deliveryTotals(RANGE);

      expect(totals.deliveredOrders).toBe(1);
      expect(totals.averageFulfillmentMinutes).toBe(90);
      // No `dueAt` was set (no delivery window), so on-time/late are both 0 —
      // an order with nothing to be on time *against* isn't counted either way.
      expect(totals.onTimeOrders).toBe(0);
      expect(totals.lateDeliveries).toBe(0);
    });

    it("ignores a later edit to the order row — delivered_at comes from the event, not `updated_at`", async () => {
      await seedUser("u1");
      await seedOrder({ id: "o1", userId: "u1", placedAt: new Date("2026-07-10T12:00:00.000Z"), total: 40 });
      await prisma.orderStatusEvent.create({
        data: { orderId: "o1", toStatus: "completed", occurredAt: new Date("2026-07-10T13:00:00.000Z") },
      });
      // A later, unrelated edit to the order (e.g. a note added) bumps
      // `updated_at` well past the real delivery moment.
      await prisma.order.update({ where: { id: "o1" }, data: { location: "Updated address" } });

      const totals = await repo.deliveryTotals(RANGE);

      expect(totals.averageFulfillmentMinutes).toBe(60);
    });
  });

  describe("returnBreakdown", () => {
    it("gap-fills every known condition/outcome to zero, including the not-inspected bucket", async () => {
      await seedUser("u1");
      await seedOrder({ id: "o1", userId: "u1", placedAt: new Date("2026-07-10T00:00:00.000Z"), total: 20 });
      await prisma.orderItem.create({ data: { id: "oi1", orderId: "o1", productId: "p1", name: "Item", imageUrl: "", quantity: 1, price: 20, position: 0 } });
      const request = await prisma.returnRequest.create({
        data: { orderId: "o1", userId: "u1", status: "resolved", requestedAt: new Date("2026-07-11T00:00:00.000Z"), resolvedAt: new Date("2026-07-12T00:00:00.000Z") },
      });
      await prisma.returnItem.create({
        data: { returnRequestId: request.id, orderItemId: "oi1", productId: "p1", quantity: 1, condition: "damaged", recoveryDecision: "disposed", refundAmount: 20 },
      });

      const breakdown = await repo.returnBreakdown(RANGE);

      const damaged = breakdown.conditions.find((c) => c.condition === "damaged");
      const unopened = breakdown.conditions.find((c) => c.condition === "unopened");
      expect(damaged?.count).toBe(1);
      expect(unopened?.count).toBe(0);

      const disposed = breakdown.outcomes.find((o) => o.decision === "disposed");
      expect(disposed?.count).toBe(1);
      // Every RETURN_RECOVERY_DECISIONS value is present even at zero, plus the
      // `null` ("not inspected") bucket — the panel's layout must not shift
      // depending on which outcomes happened to occur.
      expect(breakdown.outcomes.map((o) => o.decision)).toContain(null);
    });
  });

  describe("customerSegmentTransitions", () => {
    it("reads real movement from snapshot history, keyed by the store's local trading day", async () => {
      await seedUser("u1");
      // One snapshot at the range's start, a different one at its end — the
      // report should read this back as one `new_customers -> repeat_buyers`
      // transition, not derive it by re-classifying.
      await prisma.customerSegmentSnapshot.create({ data: { userId: "u1", segment: "new_customers", capturedOn: new Date("2026-07-01"), orders: 1, revenue: 20 } });
      await prisma.customerSegmentSnapshot.create({ data: { userId: "u1", segment: "repeat_buyers", capturedOn: new Date("2026-08-01"), orders: 3, revenue: 90 } });

      const transitions = await repo.customerSegmentTransitions(RANGE);

      const match = transitions.find((t) => t.fromSegment === "new_customers" && t.toSegment === "repeat_buyers");
      expect(match?.customers).toBe(1);
    });

    it("is empty until snapshot history exists on both sides of the range", async () => {
      const transitions = await repo.customerSegmentTransitions(RANGE);
      expect(transitions).toEqual([]);
    });
  });

  describe("money precision (phase 9)", () => {
    it("sums order totals identically whether aggregated in SQL or reconstructed per-row — proof `orders.total` is exact Decimal, not float", async () => {
      await seedUser("u1");
      // Totals chosen so naive IEEE-754 float64 accumulation drifts off the exact
      // cent value (verified below) — the failure mode Decimal(12,2) columns +
      // numeric SQL arithmetic rule out.
      const totals = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9];
      await Promise.all(
        totals.map((total, i) =>
          seedOrder({ id: `o${i}`, userId: "u1", placedAt: new Date("2026-07-10T00:00:00.000Z"), total }),
        ),
      );

      // Way 1: the report's own SQL aggregate (SUM over the `numeric` column,
      // cast to double precision once, at the very end — see the class doc's
      // "Money precision" section).
      const { revenue: aggregateRevenue } = await repo.totals(RANGE);

      // Way 2: fetch every row and sum in JS using exact Decimal addition (never
      // touching float64 until the single, final `.toNumber()`) — a
      // reconstruction that owes nothing to the SQL aggregate above.
      const rows = await prisma.order.findMany({ where: { id: { in: totals.map((_, i) => `o${i}`) } } });
      const perRowRevenue = rows
        .reduce((sum, row) => sum.add(row.total), new Prisma.Decimal(0))
        .toNumber();

      expect(perRowRevenue).toBe(56.5);
      expect(aggregateRevenue).toBe(perRowRevenue);

      // The naive float64 accumulation this reconciliation would have caught
      // under the old `Float` columns: repeated binary-float addition of these
      // exact same totals drifts to 56.50000000000001, not 56.5.
      const naiveFloatSum = totals.reduce((sum, total) => sum + total, 0);
      expect(naiveFloatSum).not.toBe(56.5);
    });
  });
});
