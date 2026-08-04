import type { DeliveryPerformanceTotals } from "./DeliveryPerformanceReport";
import type { GeoPoint } from "./Place";

export type DeliveryZonePerformance = {
  /** The settlement (city/town) orders were delivered to, or `"Unspecified"` for orders with no resolved city. */
  zone: string;
  orders: number;
  onTimeRate: number;
  /** `null` when the zone had no completed deliveries in the prior period to compare against. */
  previousOnTimeRate: number | null;
  lateDeliveries: number;
  averageFulfillmentMinutes: number;
  /** Average delivery coordinate for the zone's orders — a map marker position, not a zone boundary. `null` when none of its orders carry a coordinate. */
  centroid: GeoPoint | null;
};

export type DeliveryZoneAlertSeverity = "critical" | "warning" | "healthy";

/** A zone flagged for attention, derived from its on-time rate against fixed thresholds — never fabricated content. */
export type DeliveryZoneAlert = {
  zone: string;
  severity: DeliveryZoneAlertSeverity;
  onTimeRate: number;
  lateDeliveries: number;
};

export type DeliveryZonesReport = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  totals: DeliveryPerformanceTotals & { zonesServed: number };
  previousTotals: DeliveryPerformanceTotals;
  zones: DeliveryZonePerformance[];
  alerts: DeliveryZoneAlert[];
};
