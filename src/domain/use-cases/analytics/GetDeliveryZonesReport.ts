import { previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";
import type { DeliveryZoneAlert, DeliveryZonePerformance, DeliveryZonesReport } from "../../entities/DeliveryZonesReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

/** Below this on-time rate a zone is flagged; below {@link CRITICAL_ON_TIME_RATE} it's flagged critical. */
const WARNING_ON_TIME_RATE = 0.9;
const CRITICAL_ON_TIME_RATE = 0.75;
const ZONE_LIMIT = 8;

export class GetDeliveryZonesReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange): Promise<DeliveryZonesReport> {
    const previous = previousPeriod(range);
    const [zones, previousTotals] = await this.analytics.snapshot((repo) => Promise.all([
      repo.deliveryZonePerformance(range, previous, ZONE_LIMIT),
      repo.deliveryTotals(previous),
    ]));

    return {
      range: rangeToWire(range),
      previousRange: rangeToWire(previous),
      totals: totalsOf(zones),
      previousTotals,
      zones,
      alerts: alertsOf(zones),
    };
  }
}

function totalsOf(zones: DeliveryZonePerformance[]): DeliveryZonesReport["totals"] {
  const deliveredOrders = zones.reduce((sum, zone) => sum + zone.orders, 0);
  const onTimeOrders = zones.reduce((sum, zone) => sum + Math.round(zone.orders * zone.onTimeRate), 0);
  const lateDeliveries = zones.reduce((sum, zone) => sum + zone.lateDeliveries, 0);
  const weightedMinutes = zones.reduce((sum, zone) => sum + zone.averageMinutes * zone.orders, 0);
  return {
    deliveredOrders,
    onTimeOrders,
    lateDeliveries,
    averageMinutes: deliveredOrders ? Math.round(weightedMinutes / deliveredOrders) : 0,
    zonesServed: zones.length,
  };
}

/** Zones below the warning threshold, worst on-time rate first. */
function alertsOf(zones: DeliveryZonePerformance[]): DeliveryZoneAlert[] {
  return zones
    .filter((zone) => zone.orders > 0 && zone.onTimeRate < WARNING_ON_TIME_RATE)
    .sort((a, b) => a.onTimeRate - b.onTimeRate)
    .map((zone) => ({
      zone: zone.zone,
      severity: zone.onTimeRate < CRITICAL_ON_TIME_RATE ? "critical" : "warning",
      onTimeRate: zone.onTimeRate,
      lateDeliveries: zone.lateDeliveries,
    }));
}
