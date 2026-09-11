import { describe, expect, it, vi } from "vitest";

import { GetRefundReport } from "../GetRefundReport";

import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";

const currentTotals = {
  refundedAmount: 320,
  recoverableValue: 180,
  refundActivity: 4,
  returnedItems: 5,
  cancelledOrders: 2,
  requestedReturns: 3,
  returnedOrders: 2,
  ordersInPeriod: 40,
  orderCohortRefundRate: 0.1,
  averageProcessingMinutes: 90,
};
const returnBreakdown = { conditions: [], outcomes: [] };

describe("GetRefundReport", () => {
  it("reads the current period and equal-length baseline in one snapshot", async () => {
    const range: DateRange = {
      from: new Date("2026-07-02T00:00:00.000Z"),
      to: new Date("2026-08-01T00:00:00.000Z"),
    };
    const refundTotals = vi.fn()
      .mockResolvedValueOnce(currentTotals)
      .mockResolvedValueOnce({ ...currentTotals, refundedAmount: 160 });
    const point = { bucket: range.from.toISOString(), revenue: 320, orders: 4 };
    const reason = { reason: "Damaged item", kind: "damaged", refunds: 2, amount: 140 };
    const refundCase = { id: "c1", orderId: "o1", orderNumber: 101, userId: "u1", productName: "Milk", productImageUrl: null, reason: "Damaged item", kind: "damaged", amount: 70, status: "refunded" as const, activityAt: range.from.toISOString(), returnStatus: null, condition: null, recoveryDecision: null };
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository),
      refundTotals,
      refundSeries: vi.fn().mockResolvedValue([point]),
      compareRefundSeries: vi.fn().mockResolvedValue([{ ...point, revenue: 160 }]),
      refundReasons: vi.fn().mockResolvedValue([reason]),
      refundCases: vi.fn().mockResolvedValue([refundCase]),
      returnBreakdown: vi.fn().mockResolvedValue(returnBreakdown),
    } as unknown as IAnalyticsRepository;

    const result = await new GetRefundReport(repository).execute(range);

    expect(result.totals.refundedAmount).toBe(320);
    expect(result.previousTotals.refundedAmount).toBe(160);
    expect(result.previousRange).toEqual({
      from: "2026-06-02T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
    });
    expect(result.reasons).toEqual([reason]);
    expect(result.cases).toEqual([refundCase]);
    expect(repository.snapshot).toBeDefined();
    expect(refundTotals).toHaveBeenCalledTimes(2);
    expect(repository.refundReasons).toHaveBeenCalledWith(range, 5);
    expect(repository.refundCases).toHaveBeenCalledWith(range, 5);
  });
});
