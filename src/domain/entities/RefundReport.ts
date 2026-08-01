import type { AnalyticsGranularity, RevenuePoint } from "./Analytics";
import type { RefundKind } from "./Refund";

export type RefundReportTotals = {
  refundedAmount: number;
  refundCount: number;
  returnedItems: number;
  cancelledOrders: number;
  requestedReturns: number;
  returnedOrders: number;
  ordersInPeriod: number;
};

export type RefundReasonCount = {
  reason: string;
  kind: RefundKind;
  refunds: number;
  amount: number;
};

export type RefundCase = {
  id: string;
  orderId: string;
  orderNumber: number;
  userId: string;
  productName: string | null;
  productImageUrl: string | null;
  reason: string | null;
  kind: RefundKind | null;
  amount: number;
  status: "return_requested" | "refunded" | "cancelled";
  activityAt: string;
};

export type RefundReport = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  granularity: AnalyticsGranularity;
  totals: RefundReportTotals;
  previousTotals: RefundReportTotals;
  series: RevenuePoint[];
  previousSeries: RevenuePoint[];
  reasons: RefundReasonCount[];
  cases: RefundCase[];
};
