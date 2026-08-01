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
};
