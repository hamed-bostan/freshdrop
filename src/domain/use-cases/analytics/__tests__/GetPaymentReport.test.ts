import { describe, expect, it, vi } from "vitest";
import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";
import { GetPaymentReport } from "../GetPaymentReport";

const currentTotals = {
  paidRevenue: 240,
  successfulPayments: 4,
  failedPayments: 1,
  pendingPayments: 2,
  refundedPayments: 1,
  walletAmount: 60,
  externalAmount: 180,
};

describe("GetPaymentReport", () => {
  it("reads the current period and equal-length baseline in one snapshot", async () => {
    const range: DateRange = {
      from: new Date("2026-07-02T00:00:00.000Z"),
      to: new Date("2026-08-01T00:00:00.000Z"),
    };
    const paymentTotals = vi.fn()
      .mockResolvedValueOnce(currentTotals)
      .mockResolvedValueOnce({ ...currentTotals, paidRevenue: 120 });
    const point = { bucket: range.from.toISOString(), revenue: 240, orders: 4 };
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository as IAnalyticsRepository),
      paymentTotals,
      paymentSeries: vi.fn().mockResolvedValue([point]),
      comparePaymentSeries: vi.fn().mockResolvedValue([{ ...point, revenue: 120 }]),
      paymentIssues: vi.fn().mockResolvedValue([]),
    } as unknown as IAnalyticsRepository;

    const result = await new GetPaymentReport(repository).execute(range);

    expect(result.totals.paidRevenue).toBe(240);
    expect(result.previousTotals.paidRevenue).toBe(120);
    expect(result.previousRange).toEqual({
      from: "2026-06-02T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
    });
    expect(repository.snapshot).toBeDefined();
    expect(paymentTotals).toHaveBeenCalledTimes(2);
  });
});
