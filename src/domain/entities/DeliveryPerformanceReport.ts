import type { AnalyticsGranularity } from "./Analytics";
import type { DriverPerformance } from "./DriverPerformance";
export type DeliveryPerformanceTotals = { deliveredOrders: number; onTimeOrders: number; lateDeliveries: number; averageFulfillmentMinutes: number };
export type DeliveryPerformancePoint = { bucket: string; deliveredOrders: number; onTimeRate: number; averageFulfillmentMinutes: number };
export type DeliveryWindowPerformance = { id: string; label: string; orders: number; onTimeRate: number; averageFulfillmentMinutes: number; previousOnTimeRate: number | null };
export type LateDelivery = { orderId: string; orderNumber: number; userId: string; windowLabel: string; delayMinutes: number; deliveredAt: string; zone: string };
export type DeliveryPerformanceReport = { range: { from: string; to: string }; previousRange: { from: string; to: string }; granularity: AnalyticsGranularity; totals: DeliveryPerformanceTotals; previousTotals: DeliveryPerformanceTotals; series: DeliveryPerformancePoint[]; previousSeries: DeliveryPerformancePoint[]; windows: DeliveryWindowPerformance[]; lateDeliveries: LateDelivery[]; drivers: DriverPerformance[] };
