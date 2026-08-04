import { describe, expect, it } from "vitest";
import { previousPeriod, type DateRange } from "../Analytics";
import { classifyCustomerSegment, type CustomerLifetimeStats } from "../CustomerSegmentsReport";

const range: DateRange = { from: new Date("2026-07-01T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };
// The inactivity boundary is `previousPeriod(range).from` — derived rather than
// hand-computed, since `previousPeriod` mirrors `range`'s own width (31 days for
// a 31-day July range), which a hardcoded date would get subtly wrong.
const inactivityBoundary = previousPeriod(range).from;

const HIGH_VALUE_THRESHOLD = 1000;

function stats(overrides: Partial<CustomerLifetimeStats>): CustomerLifetimeStats {
  return {
    firstOrderAt: new Date("2026-01-01T00:00:00.000Z"),
    lastOrderAt: new Date("2026-07-15T00:00:00.000Z"),
    // After the inactivity boundary by default, so the fixture doesn't accidentally
    // qualify as reactivated in tests that mean to reach the loyal/repeat branch.
    previousOrderAt: new Date("2026-06-15T00:00:00.000Z"),
    lifetimeOrders: 5,
    lifetimeRevenue: 2000,
    ...overrides,
  };
}

describe("classifyCustomerSegment", () => {
  it("classifies a customer whose first order is inside the range as new, regardless of other stats", () => {
    expect(classifyCustomerSegment(stats({ firstOrderAt: range.from, lifetimeOrders: 1, lifetimeRevenue: 0 }), range, HIGH_VALUE_THRESHOLD)).toBe("new_customers");
  });

  it("classifies a customer whose last order is exactly on the inactivity boundary as at_risk, not dormant", () => {
    // `lastOrderAt < inactivityBoundary` is strict, so landing exactly on it falls through.
    expect(classifyCustomerSegment(stats({ lastOrderAt: inactivityBoundary }), range, HIGH_VALUE_THRESHOLD)).toBe("at_risk");
  });

  it("classifies a customer whose last order is one millisecond before the inactivity boundary as dormant", () => {
    expect(classifyCustomerSegment(stats({ lastOrderAt: new Date(inactivityBoundary.getTime() - 1) }), range, HIGH_VALUE_THRESHOLD)).toBe("dormant");
  });

  it("does not classify as at_risk when the last order lands exactly on range.from — falls through to the checks below", () => {
    // `lastOrderAt < range.from` is strict, so landing exactly on it falls through to reactivated/loyal/repeat checks below.
    expect(classifyCustomerSegment(stats({ lastOrderAt: range.from, previousOrderAt: new Date("2026-05-01T00:00:00.000Z") }), range, HIGH_VALUE_THRESHOLD)).toBe("reactivated");
  });

  it("classifies a customer whose last order is before range.from as at_risk", () => {
    expect(classifyCustomerSegment(stats({ lastOrderAt: new Date("2026-06-15T00:00:00.000Z") }), range, HIGH_VALUE_THRESHOLD)).toBe("at_risk");
  });

  it("classifies a returning customer whose previous order predates the inactivity boundary as reactivated", () => {
    expect(classifyCustomerSegment(stats({ previousOrderAt: new Date(inactivityBoundary.getTime() - 1) }), range, HIGH_VALUE_THRESHOLD)).toBe("reactivated");
  });

  it("does not classify as reactivated when previousOrderAt lands exactly on the inactivity boundary", () => {
    expect(classifyCustomerSegment(stats({ previousOrderAt: inactivityBoundary, lifetimeOrders: 5, lifetimeRevenue: 2000 }), range, HIGH_VALUE_THRESHOLD)).toBe("high_value_loyal");
  });

  it("classifies a one-order customer (previousOrderAt null) below the threshold as repeat_buyers, not reactivated", () => {
    expect(classifyCustomerSegment(stats({ previousOrderAt: null, lifetimeOrders: 1, lifetimeRevenue: 50 }), range, HIGH_VALUE_THRESHOLD)).toBe("repeat_buyers");
  });

  it("classifies a customer at or above the high-value threshold with 3+ lifetime orders as high_value_loyal", () => {
    expect(classifyCustomerSegment(stats({ lifetimeOrders: 3, lifetimeRevenue: HIGH_VALUE_THRESHOLD }), range, HIGH_VALUE_THRESHOLD)).toBe("high_value_loyal");
  });

  it("does not classify as high_value_loyal with only 2 lifetime orders even above the threshold", () => {
    expect(classifyCustomerSegment(stats({ lifetimeOrders: 2, lifetimeRevenue: HIGH_VALUE_THRESHOLD * 2 }), range, HIGH_VALUE_THRESHOLD)).toBe("repeat_buyers");
  });

  it("falls back to repeat_buyers for an active, returning customer below the high-value bar", () => {
    expect(classifyCustomerSegment(stats({ lifetimeOrders: 4, lifetimeRevenue: 100 }), range, HIGH_VALUE_THRESHOLD)).toBe("repeat_buyers");
  });
});
