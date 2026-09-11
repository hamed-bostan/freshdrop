import { describe, expect, it } from "vitest";

import {
  customerAverageOrderValue,
  type CustomerOrderSummary,
} from "../CustomerOrderSummary";

function customer(overrides: Partial<CustomerOrderSummary> = {}): CustomerOrderSummary {
  return {
    userId: "customer-1",
    name: "Customer",
    phone: "",
    email: null,
    avatarUrl: null,
    orderCount: 4,
    totalSpent: 270.55,
    lastOrderAt: "2026-07-28T12:00:00.000Z",
    rank: 1,
    ...overrides,
  };
}

describe("customerAverageOrderValue", () => {
  it("derives the mean spend from the summary", () => {
    expect(customerAverageOrderValue(customer())).toBeCloseTo(67.6375);
  });

  it("returns zero for an empty order history", () => {
    expect(customerAverageOrderValue(customer({ orderCount: 0, totalSpent: 0 }))).toBe(0);
  });
});
