import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaOrderRepository } from "../PrismaOrderRepository";

/**
 * Covers only the order-status-event emission `transitionStatus` and
 * `setTrackingStage` now do — not a general test of the repository, which (like
 * every Prisma repository in this codebase) has no unit-test coverage of its
 * query logic; that's what Phase 8's Postgres integration suite is for.
 *
 * `tx` is a hand-built fake with no `$transaction` method, so `inTransaction`
 * (see `src/infrastructure/prisma/transaction.ts`) treats it as an
 * already-open transaction client and runs the repository's work against it
 * directly — no real database needed to observe what gets written.
 */

const ITEM = {
  id: "item-1",
  productId: "product-1",
  name: "Milk",
  imageUrl: "https://example.com/milk.png",
  quantity: 1,
  price: new Prisma.Decimal(10),
  substitutionPreference: "cancel_item",
  substitutionStatus: null,
  substitutionRefundAmount: null,
  replacementProductId: null,
  replacementName: null,
  replacementImageUrl: null,
  taxExempt: true,
  taxAmount: null,
};

function orderRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "order-1",
    orderNumber: 1,
    userId: "user-1",
    status: "processing",
    phase: "current",
    deliveryType: "delivery",
    paymentStatus: "paid",
    placedAt: new Date("2026-08-01T00:00:00.000Z"),
    location: "123 Main St",
    locationLabel: null,
    destinationLat: null,
    destinationLng: null,
    city: null,
    subtotal: new Prisma.Decimal(10),
    shipping: new Prisma.Decimal(0),
    discount: new Prisma.Decimal(0),
    total: new Prisma.Decimal(10),
    taxAmount: null,
    taxRate: null,
    stage: null,
    deliveryDate: null,
    deliveryWindowId: null,
    deliveryWindow: null,
    deliveryInstructions: null,
    walletApplied: new Prisma.Decimal(0),
    items: [ITEM],
    ...overrides,
  };
}

function fakeTx(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    order: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    refund: { findMany: vi.fn().mockResolvedValue([]) },
    activityEntry: { create: vi.fn() },
    orderStatusEvent: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "event-1", ...data })),
    },
    ...overrides,
  };
}

describe("PrismaOrderRepository status events", () => {
  it("transitionStatus records the prior and new status/stage on a real transition", async () => {
    const tx = fakeTx();
    // First call: the pre-write read. Second call: re-reading the updated row.
    tx.order.findUnique
      .mockResolvedValueOnce(orderRow({ status: "processing", stage: "confirmed" }))
      .mockResolvedValueOnce(orderRow({ status: "completed", stage: "arrived" }));
    tx.order.updateMany.mockResolvedValue({ count: 1 });

    const repo = new PrismaOrderRepository(tx as never);
    const result = await repo.transitionStatus("order-1", {
      from: { status: "processing" },
      to: { status: "completed" },
    });

    expect(result).not.toBeNull();
    expect(tx.orderStatusEvent.create).toHaveBeenCalledTimes(1);
    const [{ data }] = tx.orderStatusEvent.create.mock.calls[0];
    expect(data).toMatchObject({
      orderId: "order-1",
      fromStatus: "processing",
      toStatus: "completed",
      fromStage: "confirmed",
      toStage: "arrived",
    });
  });

  it("transitionStatus records no event when the guarded precondition doesn't match", async () => {
    const tx = fakeTx();
    tx.order.findUnique.mockResolvedValue(orderRow({ status: "cancelled" }));
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    const repo = new PrismaOrderRepository(tx as never);
    const result = await repo.transitionStatus("order-1", {
      from: { status: "processing" },
      to: { status: "completed" },
    });

    expect(result).toBeNull();
    expect(tx.orderStatusEvent.create).not.toHaveBeenCalled();
  });

  it("setTrackingStage records the prior and new stage", async () => {
    const tx = fakeTx();
    tx.order.findUnique.mockResolvedValueOnce({ status: "processing", stage: "confirmed" });
    tx.order.update.mockResolvedValue(orderRow({ status: "processing", stage: "shipped" }));

    const repo = new PrismaOrderRepository(tx as never);
    await repo.setTrackingStage("order-1", { stage: "shipped", status: "processing" });

    expect(tx.orderStatusEvent.create).toHaveBeenCalledTimes(1);
    const [{ data }] = tx.orderStatusEvent.create.mock.calls[0];
    expect(data).toMatchObject({
      orderId: "order-1",
      fromStatus: "processing",
      toStatus: "processing",
      fromStage: "confirmed",
      toStage: "shipped",
    });
  });
});
