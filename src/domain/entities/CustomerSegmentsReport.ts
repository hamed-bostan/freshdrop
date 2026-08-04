import { previousPeriod, type DateRange } from "./Analytics";

export const CUSTOMER_SEGMENT_IDS = ["high_value_loyal", "repeat_buyers", "new_customers", "reactivated", "at_risk", "dormant"] as const;
export type CustomerSegmentId = (typeof CUSTOMER_SEGMENT_IDS)[number];

export type CustomerSegmentPerformance = {
  id: CustomerSegmentId;
  customers: number;
  revenue: number;
  orders: number;
  repeatCustomers: number;
};

export type CustomerSegmentComparison = CustomerSegmentPerformance & {
  previousCustomers: number;
};

export type CustomerSegmentsReport = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  segments: CustomerSegmentComparison[];
  segmentedCustomers: number;
  previousSegmentedCustomers: number;
  activeSegments: number;
  attentionSegments: number;
  loyalRevenue: number;
  previousLoyalRevenue: number;
  atRiskCustomers: number;
  previousAtRiskCustomers: number;
  /** Real segment-to-segment movement between `previousRange` and `range`'s snapshots — see `CustomerSegmentTransition`. Empty until snapshot history exists on both sides. */
  transitions: CustomerSegmentTransition[];
};

/**
 * A customer's lifetime order history as of the moment being classified —
 * exactly what {@link classifyCustomerSegment} needs and nothing it would have
 * to query for itself.
 */
export type CustomerLifetimeStats = {
  firstOrderAt: Date;
  lastOrderAt: Date;
  /** The order immediately before `lastOrderAt`, or `null` for a one-order customer. */
  previousOrderAt: Date | null;
  lifetimeOrders: number;
  lifetimeRevenue: number;
};

/**
 * Which of the six segments a customer falls into, given their lifetime stats
 * and the period being reported on.
 *
 * A pure restatement of the `CASE` in `PrismaAnalyticsRepository.customerSegmentPerformance`
 * — kept here, framework-free and testable, so the boundary behaviour (a
 * customer whose last order lands exactly on `range.from`, one whose previous
 * order lands exactly on the inactivity boundary) has a spec that doesn't
 * require a database to check. The SQL is the version that actually runs at
 * scale; this is the version a unit test can pin.
 */
export function classifyCustomerSegment(
  stats: CustomerLifetimeStats,
  range: DateRange,
  highValueRevenueThreshold: number,
): CustomerSegmentId {
  const inactivityBoundary = previousPeriod(range).from;
  if (stats.firstOrderAt >= range.from) return "new_customers";
  if (stats.lastOrderAt < inactivityBoundary) return "dormant";
  if (stats.lastOrderAt < range.from) return "at_risk";
  if (stats.previousOrderAt !== null && stats.previousOrderAt < inactivityBoundary) return "reactivated";
  if (stats.lifetimeOrders >= 3 && stats.lifetimeRevenue >= highValueRevenueThreshold) return "high_value_loyal";
  return "repeat_buyers";
}

/** One customer's segment as of a report range — the row `customerSegmentAssignments` returns per-customer, rather than `customerSegmentPerformance`'s per-segment aggregate. */
export type CustomerSegmentAssignment = {
  userId: string;
  segment: CustomerSegmentId;
  /** Orders placed within the classifying range. */
  orders: number;
  /** Revenue recognized within the classifying range. */
  revenue: number;
};

/** A daily snapshot row — see `CustomerSegmentSnapshot` in `prisma/schema.prisma`. */
export type CustomerSegmentSnapshot = CustomerSegmentAssignment & {
  /** ISO date (`YYYY-MM-DD`) the snapshot was captured on. */
  capturedOn: string;
};

/**
 * How many customers moved from `fromSegment` to `toSegment` between the
 * snapshot nearest a range's start and the one nearest its end.
 *
 * `fromSegment` is `null` for a customer with no snapshot on or before the
 * range's start — not yet tracked, rather than a segment of their own.
 */
export type CustomerSegmentTransition = {
  fromSegment: CustomerSegmentId | null;
  toSegment: CustomerSegmentId;
  customers: number;
};
