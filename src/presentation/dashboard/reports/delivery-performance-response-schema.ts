import { z } from "zod";
import { isoDateSchema, nonNegativeInt, rangeSchema } from "./analytics-wire";

const totals = z.object({ deliveredOrders: nonNegativeInt, onTimeOrders: nonNegativeInt, lateDeliveries: nonNegativeInt, averageFulfillmentMinutes: nonNegativeInt });
const point = z.object({ bucket: isoDateSchema, deliveredOrders: nonNegativeInt, onTimeRate: z.number(), averageFulfillmentMinutes: nonNegativeInt });

export const deliveryPerformanceResponseSchema = z.object({
  range: rangeSchema,
  previousRange: rangeSchema,
  granularity: z.enum(["day", "week", "month"]),
  totals,
  previousTotals: totals,
  series: z.array(point),
  previousSeries: z.array(point),
  windows: z.array(z.object({ id: z.string(), label: z.string(), orders: nonNegativeInt, onTimeRate: z.number(), averageFulfillmentMinutes: nonNegativeInt, previousOnTimeRate: z.number().nullable() })),
  lateDeliveries: z.array(z.object({ orderId: z.string(), orderNumber: nonNegativeInt, userId: z.string(), windowLabel: z.string(), delayMinutes: nonNegativeInt, deliveredAt: isoDateSchema, zone: z.string() })),
});

export type DeliveryPerformanceWire = z.infer<typeof deliveryPerformanceResponseSchema>;
