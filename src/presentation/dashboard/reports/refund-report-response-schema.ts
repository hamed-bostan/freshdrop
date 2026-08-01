import { z } from "zod";
const totals = z.object({ refundedAmount: z.number(), refundCount: z.number(), returnedItems: z.number(), cancelledOrders: z.number(), requestedReturns: z.number(), returnedOrders: z.number(), ordersInPeriod: z.number() });
const range = z.object({ from: z.string(), to: z.string() });
const series = z.array(z.object({ bucket: z.string(), revenue: z.number(), orders: z.number() }));
export const refundReportResponseSchema = z.object({
  range, previousRange: range, granularity: z.enum(["day", "week", "month"]), totals, previousTotals: totals, series, previousSeries: series,
  reasons: z.array(z.object({ reason: z.string(), kind: z.enum(["cancellation", "return", "substitution", "manual"]), refunds: z.number(), amount: z.number() })),
  cases: z.array(z.object({ id: z.string(), orderId: z.string(), orderNumber: z.number(), userId: z.string(), productName: z.string().nullable(), productImageUrl: z.string().nullable(), reason: z.string().nullable(), kind: z.enum(["cancellation", "return", "substitution", "manual"]).nullable(), amount: z.number(), status: z.enum(["return_requested", "refunded", "cancelled"]), activityAt: z.string() })),
});
export type RefundReportWire = z.infer<typeof refundReportResponseSchema>;
