import type { AnalyticsGranularity, RevenuePoint } from "./Analytics";
import type { RefundKind } from "./Refund";
import type { ReturnItemCondition, ReturnRecoveryDecision, ReturnRequestStatus } from "./Return";

export type RefundReportTotals = {
  refundedAmount: number;
  /** Value of merchandise physically returned and available for recovery. */
  recoverableValue: number;
  refundCount: number;
  returnedItems: number;
  cancelledOrders: number;
  requestedReturns: number;
  returnedOrders: number;
  ordersInPeriod: number;
  /**
   * Mean minutes from `ReturnRequest.requestedAt` to `resolvedAt`, over requests
   * *requested* in the period that have since been resolved. `0` when none have
   * — the UI must not divide by that to imply an instant turnaround.
   */
  averageProcessingMinutes: number;
};

/** One bucket of the item-condition / recovery-outcome breakdown. `null` means the item hasn't been inspected. */
export type ReturnConditionCount = { condition: ReturnItemCondition | null; count: number };
export type ReturnOutcomeCount = { decision: ReturnRecoveryDecision | null; count: number };

/** Real `GROUP BY` aggregates behind the item-condition and recovery-outcome panels. */
export type ReturnBreakdown = {
  conditions: ReturnConditionCount[];
  outcomes: ReturnOutcomeCount[];
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
  /** The linked `ReturnRequest`'s lifecycle state — `null` when this case isn't a return (a cancellation, substitution, or manual adjustment). */
  returnStatus: ReturnRequestStatus | null;
  /** The returned item's inspected condition — `null` until inspected, or when this case isn't a return. */
  condition: ReturnItemCondition | null;
  /** The inspector's disposition — `null` until inspected, or when this case isn't a return. */
  recoveryDecision: ReturnRecoveryDecision | null;
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
  returnBreakdown: ReturnBreakdown;
};
