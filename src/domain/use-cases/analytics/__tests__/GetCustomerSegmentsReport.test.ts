import { describe, expect, it, vi } from "vitest";

import { GetCustomerSegmentsReport } from "../GetCustomerSegmentsReport";

import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";

describe("GetCustomerSegmentsReport", () => {
  it("compares deterministic segment aggregates from equal-length periods", async () => {
    const range: DateRange = { from: new Date("2026-07-02T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };
    const current = [{ id: "high_value_loyal" as const, customers: 10, revenue: 800, orders: 20, repeatCustomers: 10 }, { id: "at_risk" as const, customers: 3, revenue: 0, orders: 0, repeatCustomers: 2 }];
    const previous = [{ ...current[0], customers: 8, revenue: 600 }, { ...current[1], customers: 5 }];
    const transitions = [{ fromSegment: "at_risk" as const, toSegment: "reactivated" as const, customers: 2 }];
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository),
      customerSegmentPerformance: vi.fn().mockResolvedValueOnce(current).mockResolvedValueOnce(previous),
      customerSegmentTransitions: vi.fn().mockResolvedValue(transitions),
    } as unknown as IAnalyticsRepository;

    const result = await new GetCustomerSegmentsReport(repository).execute(range);

    expect(result.segmentedCustomers).toBe(13);
    expect(result.previousSegmentedCustomers).toBe(13);
    expect(result.loyalRevenue).toBe(800);
    expect(result.atRiskCustomers).toBe(3);
    expect(result.segments.find((segment) => segment.id === "high_value_loyal")?.previousCustomers).toBe(8);
    expect(result.segments).toHaveLength(6);
    expect(result.transitions).toEqual(transitions);
  });
});
