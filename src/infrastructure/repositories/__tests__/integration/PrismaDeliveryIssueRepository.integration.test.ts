import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaDeliveryIssueRepository } from "../../PrismaDeliveryIssueRepository";
import { getTestPrisma, resetTestDatabase } from "./test-db";

/**
 * Exercises `PrismaDeliveryIssueRepository`'s raw-SQL joins (zone/driver-name
 * lookups, the report's search/status filter) against a real Postgres database —
 * the same rationale as `PrismaAnalyticsRepository.integration.test.ts`.
 */
describe("PrismaDeliveryIssueRepository (integration)", () => {
  let prisma: PrismaClient;
  let repo: PrismaDeliveryIssueRepository;

  beforeEach(async () => {
    prisma = await getTestPrisma();
    await resetTestDatabase(prisma);
    repo = new PrismaDeliveryIssueRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // `delivery_issues.created_at` defaults to the database's `now()` — there's no
  // caller-supplied timestamp to seed against (an issue is logged *as* it's
  // created, unlike an order's `placedAt`) — so the range has to bracket the
  // real clock rather than a fixed period.
  const RANGE = { from: new Date(Date.now() - 60 * 60 * 1000), to: new Date(Date.now() + 60 * 60 * 1000) };

  async function seedOrder(id: string, driverId?: string): Promise<void> {
    await prisma.user.upsert({ where: { id: "u1" }, update: {}, create: { id: "u1", phone: "700u1", name: "u1", role: "customer" } });
    await prisma.order.create({
      data: {
        id,
        userId: "u1",
        status: "completed",
        phase: "completed",
        deliveryType: "delivery",
        paymentStatus: "paid",
        placedAt: new Date("2026-07-10T12:00:00.000Z"),
        location: "Test address",
        city: "Downtown",
        subtotal: 40,
        total: 40,
        shipping: 0,
        discount: 0,
        driverId,
      },
    });
  }

  it("creates an issue, snapshotting the order's currently-assigned driver, and reads it back joined", async () => {
    const driver = await prisma.driver.create({ data: { name: "Amit Singh", rating: 4.8 } });
    await seedOrder("o1", driver.id);

    const created = await repo.create({ orderId: "o1", type: "traffic_delay", delayMinutes: 20 });

    expect(created).toMatchObject({ orderId: "o1", zone: "Downtown", type: "traffic_delay", status: "open", driverId: driver.id, driverName: "Amit Singh", delayMinutes: 20 });
  });

  it("moves an issue through its status workflow", async () => {
    await seedOrder("o1");
    const created = await repo.create({ orderId: "o1", type: "wrong_address", delayMinutes: 15 });

    const updated = await repo.updateStatus(created.id, "resolved");

    expect(updated.status).toBe("resolved");
  });

  it("filters the report list by status and search, scoped to the period", async () => {
    const driver = await prisma.driver.create({ data: { name: "Priya Reddy" } });
    await seedOrder("o1", driver.id);
    await seedOrder("o2");

    const issue1 = await repo.create({ orderId: "o1", type: "vehicle_issue", delayMinutes: 10 });
    await repo.updateStatus(issue1.id, "investigating");
    await repo.create({ orderId: "o2", type: "package_damaged", delayMinutes: 5 });

    const investigating = await repo.listForReport(RANGE, { status: "investigating" }, 10);
    expect(investigating).toHaveLength(1);
    expect(investigating[0]?.orderId).toBe("o1");

    const byDriver = await repo.listForReport(RANGE, { search: "Priya" }, 10);
    expect(byDriver).toHaveLength(1);
    expect(byDriver[0]?.driverName).toBe("Priya Reddy");

    const all = await repo.listForReport(RANGE, {}, 10);
    expect(all).toHaveLength(2);
  });
});
