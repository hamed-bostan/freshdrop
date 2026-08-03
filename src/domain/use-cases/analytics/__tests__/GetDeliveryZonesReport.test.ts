import { describe, expect, it, vi } from "vitest";
import type { DateRange } from "../../../entities/Analytics";
import type { DeliveryPerformanceTotals } from "../../../entities/DeliveryPerformanceReport";
import type { DeliveryZonePerformance } from "../../../entities/DeliveryZonesReport";
import type { IAnalyticsRepository } from "../../../repositories/IAnalyticsRepository";
import { GetDeliveryZonesReport } from "../GetDeliveryZonesReport";

describe("GetDeliveryZonesReport", () => {
  const range: DateRange = { from: new Date("2026-07-02T00:00:00.000Z"), to: new Date("2026-08-01T00:00:00.000Z") };

  const zones: DeliveryZonePerformance[] = [
    { zone: "Toronto", orders: 100, onTimeRate: 0.95, previousOnTimeRate: 0.9, lateDeliveries: 5, averageMinutes: 40, centroid: { latitude: 43.6, longitude: -79.4 } },
    { zone: "Mississauga", orders: 20, onTimeRate: 0.6, previousOnTimeRate: 0.8, lateDeliveries: 8, averageMinutes: 55, centroid: null },
    { zone: "Unspecified", orders: 5, onTimeRate: 1, previousOnTimeRate: null, lateDeliveries: 0, averageMinutes: 30, centroid: null },
  ];

  const previousTotals: DeliveryPerformanceTotals = { deliveredOrders: 110, onTimeOrders: 90, lateDeliveries: 12, averageMinutes: 45 };

  function repositoryWith(rows: DeliveryZonePerformance[]): IAnalyticsRepository {
    const repository = {
      snapshot: <T>(work: (analytics: IAnalyticsRepository) => Promise<T>) => work(repository as unknown as IAnalyticsRepository),
      deliveryZonePerformance: vi.fn().mockResolvedValue(rows),
      deliveryTotals: vi.fn().mockResolvedValue(previousTotals),
    };
    return repository as unknown as IAnalyticsRepository;
  }

  it("aggregates zone totals weighted by order volume", async () => {
    const result = await new GetDeliveryZonesReport(repositoryWith(zones)).execute(range);

    expect(result.totals.deliveredOrders).toBe(125);
    expect(result.totals.onTimeOrders).toBe(95 + 12 + 5);
    expect(result.totals.lateDeliveries).toBe(13);
    expect(result.totals.zonesServed).toBe(3);
    expect(result.previousTotals).toEqual(previousTotals);
    expect(result.zones).toHaveLength(3);
  });

  it("flags only zones below the warning on-time threshold, worst first", async () => {
    const result = await new GetDeliveryZonesReport(repositoryWith(zones)).execute(range);

    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]).toMatchObject({ zone: "Mississauga", severity: "critical" });
  });

  it("reports no alerts when every zone is on-time", async () => {
    const healthy = zones.map((zone) => ({ ...zone, onTimeRate: 0.98 }));
    const result = await new GetDeliveryZonesReport(repositoryWith(healthy)).execute(range);

    expect(result.alerts).toHaveLength(0);
  });
});
