import { describe, expect, it } from "vitest";
import type { Refund } from "../Refund";
import type { Order } from "../Order";
import { orderNetPaid, orderRecognizedRevenue, orderRefundedTotal, orderShippingRefunded } from "../Order";

function refund(overrides: Partial<Refund> & Pick<Refund, "amount">): Refund {
  return {
    id: "refund-1",
    orderId: "order-1",
    userId: "user-1",
    kind: "manual",
    taxAmount: 0,
    createdAt: new Date().toISOString(),
    lines: [],
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: 1,
    userId: "user-1",
    status: "processing",
    phase: "current",
    deliveryType: "delivery",
    paymentStatus: "paid",
    placedAt: new Date().toISOString(),
    location: "Somewhere",
    subtotal: 100,
    shipping: 5,
    discount: 0,
    total: 105,
    taxAmount: null,
    taxRate: null,
    items: [],
    walletApplied: 0,
    refunds: [],
    ...overrides,
  };
}

describe("orderRefundedTotal", () => {
  it("sums every refund's amount", () => {
    const refunds = [refund({ amount: 20 }), refund({ amount: 30 })];
    expect(orderRefundedTotal(refunds)).toBe(50);
  });

  it("is 0 with no refunds", () => {
    expect(orderRefundedTotal([])).toBe(0);
  });
});

describe("orderNetPaid", () => {
  it("subtracts the refunded total from the order total", () => {
    const o = order({ total: 105 });
    expect(orderNetPaid(o, [refund({ amount: 40 })])).toBe(65);
  });

  it("equals total when nothing was refunded", () => {
    const o = order({ total: 105 });
    expect(orderNetPaid(o, [])).toBe(105);
  });
});

describe("orderRecognizedRevenue", () => {
  it("matches orderNetPaid — the two are the same computation", () => {
    const o = order({ total: 105 });
    const refunds = [refund({ amount: 40 })];
    expect(orderRecognizedRevenue(o, refunds)).toBe(orderNetPaid(o, refunds));
  });

  it("nets to 0 for a cancelled order whose ledger covers the full total", () => {
    // The `cancellation` kind refund CancelOrder records for its full total —
    // no special-casing on `status` needed, the ledger sum alone gets this to 0.
    const o = order({ status: "cancelled", total: 105 });
    const refunds = [refund({ amount: 105, kind: "cancellation" })];
    expect(orderRecognizedRevenue(o, refunds)).toBe(0);
  });
});

describe("orderShippingRefunded", () => {
  it("stays a pure order-state derivation, independent of the ledger", () => {
    // Every line refunded (the cancelEmptied path) — no refunds array needed.
    const o = order({
      status: "cancelled",
      shipping: 5,
      items: [
        {
          id: "item-1",
          productId: "p1",
          name: "Item",
          imageUrl: "",
          quantity: 1,
          price: 20,
          substitutionPreference: "refund",
          taxExempt: false,
          taxAmount: null,
          substitution: { status: "refunded", refundAmount: 20 },
        },
      ],
    });
    expect(orderShippingRefunded(o)).toBe(5);
  });
});
