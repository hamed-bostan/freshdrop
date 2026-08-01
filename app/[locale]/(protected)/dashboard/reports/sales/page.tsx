import { previousPeriod, rangeToWire } from "@/src/domain/entities/Analytics";
import { hasCustomAnalyticsRange, parseAnalyticsRange, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { analyticsServerApi } from "@/src/presentation/dashboard/analytics/analytics-server-api";
import { SalesReportScreen } from "@/src/presentation/dashboard/reports/SalesReportScreen";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SalesReportPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const analyticsParams = new URLSearchParams(params);
  analyticsParams.set("rankLimit", "5");
  return <SalesReportScreen analytics={await analyticsServerApi.getOverview(analyticsParams)} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} comparisonRange={rangeToWire(previousPeriod(range))} />;
}
