import { z } from "zod";

import { isoDateSchema, moneySchema, nonNegativeInt, rangeSchema, seriesSchema } from "./analytics-wire";

const totals = z.object({
  refundedAmount: moneySchema,
  recoverableValue: moneySchema,
  refundActivity: nonNegativeInt,
  returnedItems: nonNegativeInt,
  cancelledOrders: nonNegativeInt,
  requestedReturns: nonNegativeInt,
  returnedOrders: nonNegativeInt,
  ordersInPeriod: nonNegativeInt,
  orderCohortRefundRate: z.number(),
  averageProcessingMinutes: z.number(),
});
const returnCondition = z.enum(["unopened", "resellable", "damaged", "expired", "missing_parts"]);
const returnRecoveryDecision = z.enum(["restocked", "returned_to_supplier", "discounted", "disposed", "pending"]);
const returnRequestStatus = z.enum(["requested", "in_transit", "received", "inspected", "resolved", "rejected"]);

export const refundReportResponseSchema = z.object({
  range: rangeSchema, previousRange: rangeSchema, granularity: z.enum(["day", "week", "month"]), totals, previousTotals: totals, series: seriesSchema, previousSeries: seriesSchema,
  reasons: z.array(z.object({ reason: z.string(), kind: z.enum(["cancellation", "return", "substitution", "manual"]), refunds: nonNegativeInt, amount: moneySchema })),
  cases: z.array(z.object({
    id: z.string(), orderId: z.string(), orderNumber: nonNegativeInt, userId: z.string(), productName: z.string().nullable(), productImageUrl: z.string().nullable(), reason: z.string().nullable(), kind: z.enum(["cancellation", "return", "substitution", "manual"]).nullable(), amount: moneySchema, status: z.enum(["return_requested", "refunded", "cancelled"]), activityAt: isoDateSchema,
    returnStatus: returnRequestStatus.nullable(), condition: returnCondition.nullable(), recoveryDecision: returnRecoveryDecision.nullable(),
  })),
  returnBreakdown: z.object({
    conditions: z.array(z.object({ condition: returnCondition.nullable(), count: nonNegativeInt })),
    outcomes: z.array(z.object({ decision: returnRecoveryDecision.nullable(), count: nonNegativeInt })),
  }),
});

export type RefundReportWire = z.infer<typeof refundReportResponseSchema>;
