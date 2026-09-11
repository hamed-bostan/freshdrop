import { hasCustomAnalyticsRange, parseAnalyticsRange, parseComparisonMode, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { customerSegmentsServerApi } from "@/src/presentation/dashboard/reports/customer-segments-server-api";
import { CustomerSegmentsScreen } from "@/src/presentation/dashboard/reports/CustomerSegmentsScreen";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function CustomerSegmentsPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  return <CustomerSegmentsScreen report={await customerSegmentsServerApi.get(params)} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} compareMode={parseComparisonMode(params)} />;
}
