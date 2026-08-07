import { describe, expect, it, vi } from "vitest";

import { GetDeliveryPerformanceReport } from "../GetDeliveryPerformanceReport";

import type { DateRange } from "../../../entities/Analytics";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";

const currentTotals = { deliveredOrders: 40, onTimeOrders: 34, lateDeliveries: 6, averageFulfillmentMinutes: 28 };

describe("GetDeliveryPerformanceReport", () => {
  it("reads the current period and equal-length baseline in one snapshot", async () => {
    const range: DateRange = {
      from: new Date("2026-07-02T00:00:00.000Z"),
      to: new Date("2026-08-01T00:00:00.000Z"),
    };
    const deliveryTotals = vi.fn()
      .mockResolvedValueOnce(currentTotals)
      .mockResolvedValueOnce({ ...currentTotals, deliveredOrders: 30 });
    const point = { bucket: range.from.toISOString(), deliveredOrders: 40, onTimeRate: 0.85, averageFulfillmentMinutes: 28 };
    const lateDelivery = { orderId: "o1", orderNumber: 101, userId: "u1", windowLabel: "9am-12pm", delayMinutes: 15, deliveredAt: range.from.toISOString(), zone: "downtown" };
    const driver = { driverId: "d1", name: "Amit Singh", completedDeliveries: 12, onTimeRate: 0.9, averageRating: 4.8 };
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository),
      deliveryTotals,
      deliverySeries: vi.fn().mockResolvedValue([point]),
      lateDeliveries: vi.fn().mockResolvedValue([lateDelivery]),
      driverPerformance: vi.fn().mockResolvedValue([driver]),
    } as unknown as IAnalyticsRepository;

    const result = await new GetDeliveryPerformanceReport(repository).execute(range);

    expect(result.totals.deliveredOrders).toBe(40);
    expect(result.previousTotals.deliveredOrders).toBe(30);
    expect(result.previousRange).toEqual({
      from: "2026-06-02T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
    });
    expect(result.lateDeliveries).toEqual([lateDelivery]);
    expect(result.drivers).toEqual([driver]);
    expect(repository.snapshot).toBeDefined();
    expect(deliveryTotals).toHaveBeenCalledTimes(2);
    expect(repository.lateDeliveries).toHaveBeenCalledWith(range, 5);
    expect(repository.driverPerformance).toHaveBeenCalledWith(range, 5);
  });
});
