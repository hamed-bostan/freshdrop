import type { AnalyticsGranularity, DateRange, RevenuePoint } from "./Analytics";
import type { PaymentStatus } from "./Order";

export type PaymentReportTotals = {
  paidRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  walletAmount: number;
  externalAmount: number;
};

export type PaymentIssue = {
  orderId: string;
  orderNumber: number;
  userId: string;
  status: Extract<PaymentStatus, "failed" | "refunded">;
  amount: number;
  placedAt: string;
};

export type PaymentReport = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  granularity: AnalyticsGranularity;
  totals: PaymentReportTotals;
  previousTotals: PaymentReportTotals;
  series: RevenuePoint[];
  previousSeries: RevenuePoint[];
  issues: PaymentIssue[];
};

/** Repository projection for a bounded period; the use-case adds comparisons. */
export type PaymentReportPeriod = {
  range: DateRange;
  totals: PaymentReportTotals;
  series: RevenuePoint[];
};
