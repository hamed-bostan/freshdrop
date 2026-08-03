import { z } from "zod";
const range = z.object({ from: z.string(), to: z.string() });
const zone = z.object({ zone: z.string(), orders: z.number(), onTimeRate: z.number(), previousOnTimeRate: z.number().nullable(), lateDeliveries: z.number(), averageMinutes: z.number(), centroid: z.object({ latitude: z.number(), longitude: z.number() }).nullable() });
const alert = z.object({ zone: z.string(), severity: z.enum(["critical", "warning", "healthy"]), onTimeRate: z.number(), lateDeliveries: z.number() });
const totals = z.object({ deliveredOrders: z.number(), onTimeOrders: z.number(), lateDeliveries: z.number(), averageMinutes: z.number() });
export const deliveryZonesResponseSchema = z.object({
  range,
  previousRange: range,
  totals: totals.extend({ zonesServed: z.number() }),
  previousTotals: totals,
  zones: z.array(zone),
  alerts: z.array(alert),
});
export type DeliveryZonesWire = z.infer<typeof deliveryZonesResponseSchema>;
