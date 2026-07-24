import type { AnalyticsGranularity, RevenuePoint } from "@/src/domain/entities/Analytics";
import { RevenueChartClient } from "./RevenueChartClient";

export type RevenueChartProps = {
  points: RevenuePoint[];
  previousPoints: RevenuePoint[];
  previousYearPoints: RevenuePoint[];
  granularity: AnalyticsGranularity;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  previousYearRange: { from: string; to: string };
};

/**
 * A Server Component in name only — every figure it holds is already plain data
 * off `AnalyticsOverviewWire`, and the metric/comparison toggles that decide how
 * to read it are client-only state (see `RevenueChartClient`). Kept as its own
 * file rather than inlined at the call site so `DashboardOverviewScreen` names a
 * "revenue chart" prop bag instead of six loose arrays.
 */
export function RevenueChart(props: RevenueChartProps) {
  return <RevenueChartClient {...props} />;
}
