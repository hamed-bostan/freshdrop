import { z } from "zod";

const totalsSchema = z.object({
  paidRevenue: z.number(),
  successfulPayments: z.number(),
  failedPayments: z.number(),
  pendingPayments: z.number(),
  refundedPayments: z.number(),
  walletAmount: z.number(),
  externalAmount: z.number(),
});

const rangeSchema = z.object({ from: z.string(), to: z.string() });
const seriesSchema = z.array(z.object({ bucket: z.string(), revenue: z.number(), orders: z.number() }));

export const paymentReportResponseSchema = z.object({
  range: rangeSchema,
  previousRange: rangeSchema,
  granularity: z.enum(["day", "week", "month"]),
  totals: totalsSchema,
  previousTotals: totalsSchema,
  series: seriesSchema,
  previousSeries: seriesSchema,
  issues: z.array(z.object({
    orderId: z.string(),
    orderNumber: z.number(),
    userId: z.string(),
    status: z.enum(["failed", "refunded"]),
    amount: z.number(),
    placedAt: z.string(),
  })),
});

export type PaymentReportWire = z.infer<typeof paymentReportResponseSchema>;
