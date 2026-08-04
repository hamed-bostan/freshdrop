import { hasCustomAnalyticsRange, parseAnalyticsRange, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { CustomerInsightsScreen } from "@/src/presentation/dashboard/reports/CustomerInsightsScreen";
import { customerInsightsServerApi } from "@/src/presentation/dashboard/reports/customer-insights-server-api";
import { customerSegmentsServerApi } from "@/src/presentation/dashboard/reports/customer-segments-server-api";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CustomerInsightsPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const [report, segmentsReport] = await Promise.all([customerInsightsServerApi.get(params), customerSegmentsServerApi.get(params)]);
  return <CustomerInsightsScreen report={report} segments={segmentsReport.segments} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} />;
}
