import { describe, expect, it, vi } from "vitest";
import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";
import { GetAnalyticsOverview } from "../GetAnalyticsOverview";

const currentTotals = { revenue: 600, orders: 6, units: 12, customers: 4, averageOrderValue: 100 };
const segments = { totalCustomers: 4, newCustomers: 2, returningCustomers: 2, repeatCustomers: 3 };

function buildRepository(range: DateRange) {
  const point = { bucket: range.from.toISOString(), revenue: 600, orders: 6 };
  const totals = vi.fn().mockResolvedValueOnce(currentTotals).mockResolvedValueOnce({ ...currentTotals, revenue: 400 });
  const topProducts = vi.fn().mockResolvedValue([]);
  const topCategories = vi.fn().mockResolvedValue([]);
  const repository = {
    snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository as IAnalyticsRepository),
    totals,
    revenueSeries: vi.fn().mockResolvedValue([point]),
    compareRevenueSeries: vi.fn().mockResolvedValue([{ ...point, revenue: 400 }]),
    statusBreakdown: vi.fn().mockResolvedValue([{ status: "delivered", orders: 6, revenue: 600 }]),
    topProducts,
    topCategories,
    customerSegments: vi.fn().mockResolvedValueOnce(segments).mockResolvedValueOnce({ ...segments, newCustomers: 1, returningCustomers: 3 }),
  } as unknown as IAnalyticsRepository;
  return { repository, totals, topProducts, topCategories };
}

describe("GetAnalyticsOverview", () => {
  const range: DateRange = { from: new Date("2026-07-02T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };

  it("reads the current period, its equal-length baseline, and the same days a year earlier in one snapshot", async () => {
    const { repository, totals, topProducts, topCategories } = buildRepository(range);

    const result = await new GetAnalyticsOverview(repository).execute(range);

    expect(result.totals.revenue).toBe(600);
    expect(result.previousTotals.revenue).toBe(400);
    expect(result.previousRange).toEqual({ from: "2026-06-02T00:00:00.000Z", to: "2026-07-02T00:00:00.000Z" });
    expect(result.previousYearRange).toEqual({ from: "2025-07-02T00:00:00.000Z", to: "2025-08-01T00:00:00.000Z" });
    expect(result.customerSegments).toEqual(segments);
    expect(result.previousCustomerSegments.newCustomers).toBe(1);
    expect(repository.snapshot).toBeDefined();
    expect(totals).toHaveBeenCalledTimes(2);
    expect(topProducts).toHaveBeenCalledWith(range, 5, "revenue", { from: new Date("2026-06-02T00:00:00.000Z"), to: range.from });
    expect(topCategories).toHaveBeenCalledWith(range, 5, "revenue");
  });

  it("passes an explicit sort and rank limit through to the ranked panels", async () => {
    const { repository, topProducts, topCategories } = buildRepository(range);

    await new GetAnalyticsOverview(repository).execute(range, { productsSort: "units", categoriesSort: "units", rankLimit: 10 });

    expect(topProducts).toHaveBeenCalledWith(range, 10, "units", { from: new Date("2026-06-02T00:00:00.000Z"), to: range.from });
    expect(topCategories).toHaveBeenCalledWith(range, 10, "units");
  });
});
