import { z } from "zod";

import type { CustomerSegmentsReport } from "@/src/domain/entities/CustomerSegmentsReport";

import { moneySchema, nonNegativeInt, rangeSchema } from "./analytics-wire";

const segmentId = z.enum(["high_value_loyal", "repeat_buyers", "new_customers", "reactivated", "at_risk", "dormant"]);
const segment = z.object({ id: segmentId, customers: nonNegativeInt, revenue: moneySchema, orders: nonNegativeInt, repeatCustomers: nonNegativeInt, previousCustomers: nonNegativeInt });
const transition = z.object({ fromSegment: segmentId.nullable(), toSegment: segmentId, customers: nonNegativeInt });

export const customerSegmentsResponseSchema = z.object({
  range: rangeSchema, previousRange: rangeSchema, segments: z.array(segment),
  segmentedCustomers: nonNegativeInt, previousSegmentedCustomers: nonNegativeInt, activeSegments: nonNegativeInt, attentionSegments: nonNegativeInt,
  loyalRevenue: moneySchema, previousLoyalRevenue: moneySchema, atRiskCustomers: nonNegativeInt, previousAtRiskCustomers: nonNegativeInt,
  transitions: z.array(transition),
}) satisfies z.ZodType<CustomerSegmentsReport>;

export type CustomerSegmentsWire = z.infer<typeof customerSegmentsResponseSchema>;
