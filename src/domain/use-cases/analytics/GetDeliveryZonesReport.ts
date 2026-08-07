import { previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";

import type { DeliveryZoneAlert, DeliveryZoneDemandAlert, DeliveryZonePerformance, DeliveryZonesReport } from "../../entities/DeliveryZonesReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

/** Below this on-time rate a zone is flagged; below {@link CRITICAL_ON_TIME_RATE} it's flagged critical. */
const WARNING_ON_TIME_RATE = 0.9;
const CRITICAL_ON_TIME_RATE = 0.75;
const ZONE_LIMIT = 8;

/** A zone's order volume must grow by at least this much vs. the prior period to be flagged as a demand alert. */
const DEMAND_GROWTH_RATE = 0.1;
/** Below this many current-period orders, a growth rate is too noisy (small denominators) to surface as an alert. */
const MIN_ORDERS_FOR_DEMAND_ALERT = 5;

export class GetDeliveryZonesReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange, comparisonRange?: DateRange): Promise<DeliveryZonesReport> {
    const previous = comparisonRange ?? previousPeriod(range);
    const [zones, previousTotals] = await this.analytics.snapshot((repo) => Promise.all([
      repo.deliveryZonePerformance(range, previous, ZONE_LIMIT),
      repo.deliveryTotals(previous),
    ]));
    const alerts = alertsOf(zones);

    return {
      range: rangeToWire(range),
      previousRange: rangeToWire(previous),
      totals: totalsOf(zones),
      previousTotals,
      zones,
      alerts,
      demandAlert: demandAlertOf(zones, new Set(alerts.map((alert) => alert.zone))),
    };
  }
}

function totalsOf(zones: DeliveryZonePerformance[]): DeliveryZonesReport["totals"] {
  const deliveredOrders = zones.reduce((sum, zone) => sum + zone.orders, 0);
  const onTimeOrders = zones.reduce((sum, zone) => sum + Math.round(zone.orders * zone.onTimeRate), 0);
  const lateDeliveries = zones.reduce((sum, zone) => sum + zone.lateDeliveries, 0);
  const weightedMinutes = zones.reduce((sum, zone) => sum + zone.averageFulfillmentMinutes * zone.orders, 0);
  return {
    deliveredOrders,
    onTimeOrders,
    lateDeliveries,
    averageFulfillmentMinutes: deliveredOrders ? Math.round(weightedMinutes / deliveredOrders) : 0,
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

/**
 * The zone with the sharpest order-volume growth vs. the prior period, above
 * {@link DEMAND_GROWTH_RATE} — excluding zones already flagged by {@link alertsOf}
 * so one zone doesn't occupy two alert rows. `null` when no zone qualifies.
 */
function demandAlertOf(zones: DeliveryZonePerformance[], alreadyFlagged: Set<string>): DeliveryZoneDemandAlert | null {
  const candidates = zones
    .filter((zone) => !alreadyFlagged.has(zone.zone) && zone.orders >= MIN_ORDERS_FOR_DEMAND_ALERT && zone.previousOrders != null && zone.previousOrders > 0)
    .map((zone) => ({ zone: zone.zone, orders: zone.orders, previousOrders: zone.previousOrders as number, growthRate: (zone.orders - (zone.previousOrders as number)) / (zone.previousOrders as number) }))
    .filter((candidate) => candidate.growthRate >= DEMAND_GROWTH_RATE)
    .sort((a, b) => b.growthRate - a.growthRate);
  return candidates[0] ?? null;
}
