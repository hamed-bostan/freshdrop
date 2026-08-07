import {
  hasCustomAnalyticsRange,
  parseAnalyticsRange,
  parseComparisonMode,
  toDateParam,
  toInclusiveEndParam,
} from "@/src/lib/api/analytics-params";
import { analyticsServerApi } from "@/src/presentation/dashboard/analytics/analytics-server-api";
import { AnalyticsScreen } from "@/src/presentation/dashboard/analytics/AnalyticsScreen";

// Read from the REST API (BFF) per request, same as the overview it complements.
export const dynamic = "force-dynamic";

type DashboardAnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardAnalyticsPage({ searchParams }: DashboardAnalyticsPageProps) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  );

  const range = parseAnalyticsRange(params);
  const analytics = await analyticsServerApi.getOverview(params);

  return (
    <AnalyticsScreen
      analytics={analytics}
      from={toDateParam(range.from)}
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      compareMode={parseComparisonMode(params)}
    />
  );
}
