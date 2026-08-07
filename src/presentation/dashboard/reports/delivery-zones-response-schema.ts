import { z } from "zod";

import { nonNegativeInt, rangeSchema } from "./analytics-wire";

const zone = z.object({ zone: z.string(), orders: nonNegativeInt, onTimeRate: z.number(), previousOnTimeRate: z.number().nullable(), previousOrders: nonNegativeInt.nullable(), lateDeliveries: nonNegativeInt, averageFulfillmentMinutes: nonNegativeInt, centroid: z.object({ latitude: z.number(), longitude: z.number() }).nullable() });
const alert = z.object({ zone: z.string(), severity: z.enum(["critical", "warning", "healthy"]), onTimeRate: z.number(), lateDeliveries: nonNegativeInt });
const demandAlert = z.object({ zone: z.string(), orders: nonNegativeInt, previousOrders: nonNegativeInt, growthRate: z.number() });
const totals = z.object({ deliveredOrders: nonNegativeInt, onTimeOrders: nonNegativeInt, lateDeliveries: nonNegativeInt, averageFulfillmentMinutes: nonNegativeInt });

export const deliveryZonesResponseSchema = z.object({
  range: rangeSchema,
  previousRange: rangeSchema,
  totals: totals.extend({ zonesServed: nonNegativeInt }),
  previousTotals: totals,
  zones: z.array(zone),
  alerts: z.array(alert),
  demandAlert: demandAlert.nullable(),
});

export type DeliveryZonesWire = z.infer<typeof deliveryZonesResponseSchema>;
