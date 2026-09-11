import { describe, expect, it, vi } from "vitest";

import { GetCustomerInsightsReport } from "../GetCustomerInsightsReport";

import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";

describe("GetCustomerInsightsReport", () => {
  it("builds all customer panels from one consistent current and previous snapshot", async () => {
    const range: DateRange = { from: new Date("2026-07-02T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };
    const totals = { revenue: 600, orders: 6, units: 12, customers: 4, averageOrderValue: 100 };
    const segments = { totalCustomers: 4, newCustomers: 2, returningCustomers: 2, repeatCustomers: 3 };
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository),
      totals: vi.fn().mockResolvedValueOnce(totals).mockResolvedValueOnce({ ...totals, revenue: 400 }),
      customerSegments: vi.fn().mockResolvedValueOnce(segments).mockResolvedValueOnce({ ...segments, newCustomers: 1, returningCustomers: 3 }),
      customerGrowthSeries: vi.fn().mockResolvedValue([{ bucket: range.from.toISOString(), newCustomers: 2, returningCustomers: 2, newRevenue: 200, returningRevenue: 400 }]),
      purchaseFrequency: vi.fn().mockResolvedValue({ oneOrder: 2, twoToThreeOrders: 2, fourToSixOrders: 0, sevenPlusOrders: 0, averageOrders: 1.5, averageDaysBetweenOrders: 8 }),
      retentionCohorts: vi.fn().mockResolvedValue([{ cohort: "2026-07-01T00:00:00.000Z", customers: 2, retention: [1, .5, 0, 0, 0, 0] }]),
    } as unknown as IAnalyticsRepository;

    const result = await new GetCustomerInsightsReport(repository).execute(range);

    expect(result.segments).toEqual(segments);
    expect(result.previousTotals.revenue).toBe(400);
    expect(result.previousRange).toEqual({ from: "2026-06-02T00:00:00.000Z", to: "2026-07-02T00:00:00.000Z" });
    expect(result.cohorts[0]?.retention[1]).toBe(.5);
    expect(repository.snapshot).toBeDefined();
    expect(repository.customerGrowthSeries).toHaveBeenCalledTimes(2);
  });
});
