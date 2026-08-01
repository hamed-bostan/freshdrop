import { z } from "zod";
import type { CustomerSegmentsReport } from "@/src/domain/entities/CustomerSegmentsReport";

const segment = z.object({ id: z.enum(["high_value_loyal", "repeat_buyers", "new_customers", "reactivated", "at_risk", "dormant"]), customers: z.number(), revenue: z.number(), orders: z.number(), repeatCustomers: z.number(), previousCustomers: z.number() });
export const customerSegmentsResponseSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }), previousRange: z.object({ from: z.string(), to: z.string() }), segments: z.array(segment),
  segmentedCustomers: z.number(), previousSegmentedCustomers: z.number(), activeSegments: z.number(), attentionSegments: z.number(), loyalRevenue: z.number(), previousLoyalRevenue: z.number(), atRiskCustomers: z.number(), previousAtRiskCustomers: z.number(),
}) satisfies z.ZodType<CustomerSegmentsReport>;
export type CustomerSegmentsWire = z.infer<typeof customerSegmentsResponseSchema>;
