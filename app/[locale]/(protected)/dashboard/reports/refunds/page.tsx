import { hasCustomAnalyticsRange, parseAnalyticsRange, parseComparisonMode, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { RefundsReturnsScreen } from "@/src/presentation/dashboard/reports/RefundsReturnsScreen";
import { refundReportServerApi } from "@/src/presentation/dashboard/reports/refund-report-server-api";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function RefundsReportPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const view = params.get("view") === "items" ? "items" : "overview";
  const range = parseAnalyticsRange(params); const report = await refundReportServerApi.get(params);
  const customers = await customersServerApi.listByIds([...new Set(report.cases.map((item) => item.userId))]);
  return <RefundsReturnsScreen report={report} customers={customers.items} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} compareMode={parseComparisonMode(params)} view={view} queryString={params.toString()} />;
}
