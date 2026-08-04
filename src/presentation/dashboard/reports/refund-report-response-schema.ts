import { z } from "zod";
const totals = z.object({ refundedAmount: z.number(), recoverableValue: z.number(), refundCount: z.number(), returnedItems: z.number(), cancelledOrders: z.number(), requestedReturns: z.number(), returnedOrders: z.number(), ordersInPeriod: z.number(), averageProcessingMinutes: z.number() });
const range = z.object({ from: z.string(), to: z.string() });
const series = z.array(z.object({ bucket: z.string(), revenue: z.number(), orders: z.number() }));
const returnCondition = z.enum(["unopened", "resellable", "damaged", "expired", "missing_parts"]);
const returnRecoveryDecision = z.enum(["restocked", "returned_to_supplier", "discounted", "disposed", "pending"]);
const returnRequestStatus = z.enum(["requested", "in_transit", "received", "inspected", "resolved", "rejected"]);
export const refundReportResponseSchema = z.object({
  range, previousRange: range, granularity: z.enum(["day", "week", "month"]), totals, previousTotals: totals, series, previousSeries: series,
  reasons: z.array(z.object({ reason: z.string(), kind: z.enum(["cancellation", "return", "substitution", "manual"]), refunds: z.number(), amount: z.number() })),
  cases: z.array(z.object({
    id: z.string(), orderId: z.string(), orderNumber: z.number(), userId: z.string(), productName: z.string().nullable(), productImageUrl: z.string().nullable(), reason: z.string().nullable(), kind: z.enum(["cancellation", "return", "substitution", "manual"]).nullable(), amount: z.number(), status: z.enum(["return_requested", "refunded", "cancelled"]), activityAt: z.string(),
    returnStatus: returnRequestStatus.nullable(), condition: returnCondition.nullable(), recoveryDecision: returnRecoveryDecision.nullable(),
  })),
  returnBreakdown: z.object({
    conditions: z.array(z.object({ condition: returnCondition.nullable(), count: z.number() })),
    outcomes: z.array(z.object({ decision: returnRecoveryDecision.nullable(), count: z.number() })),
  }),
});
export type RefundReportWire = z.infer<typeof refundReportResponseSchema>;
