import type { AnalyticsGranularity, AnalyticsTotals, CustomerSegments } from "./Analytics";

export type CustomerGrowthPoint = {
  bucket: string;
  newCustomers: number;
  returningCustomers: number;
  newRevenue: number;
  returningRevenue: number;
};

export type PurchaseFrequency = {
  oneOrder: number;
  twoToThreeOrders: number;
  fourToSixOrders: number;
  sevenPlusOrders: number;
  averageOrders: number;
  averageDaysBetweenOrders: number | null;
};

export type RetentionCohort = {
  cohort: string;
  customers: number;
  retention: number[];
};

export type CustomerInsightsReport = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  granularity: AnalyticsGranularity;
  totals: AnalyticsTotals;
  previousTotals: AnalyticsTotals;
  segments: CustomerSegments;
  previousSegments: CustomerSegments;
  growth: CustomerGrowthPoint[];
  previousGrowth: CustomerGrowthPoint[];
  frequency: PurchaseFrequency;
  cohorts: RetentionCohort[];
};
