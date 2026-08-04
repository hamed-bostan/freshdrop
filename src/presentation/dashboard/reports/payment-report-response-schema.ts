import { z } from "zod";
import { isoDateSchema, moneySchema, nonNegativeInt, rangeSchema, seriesSchema } from "./analytics-wire";

const totalsSchema = z.object({
  paidRevenue: moneySchema,
  successfulPayments: nonNegativeInt,
  failedPayments: nonNegativeInt,
  pendingPayments: nonNegativeInt,
  refundedPayments: nonNegativeInt,
  walletAmount: moneySchema,
  externalAmount: moneySchema,
});

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
    orderNumber: nonNegativeInt,
    userId: z.string(),
    status: z.enum(["failed", "refunded"]),
    amount: moneySchema,
    placedAt: isoDateSchema,
  })),
});

export type PaymentReportWire = z.infer<typeof paymentReportResponseSchema>;
