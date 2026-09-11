import { hasCustomAnalyticsRange, parseAnalyticsRange, parseComparisonMode, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { paymentReportServerApi } from "@/src/presentation/dashboard/reports/payment-report-server-api";
import { PaymentSummaryScreen } from "@/src/presentation/dashboard/reports/PaymentSummaryScreen";

export const dynamic = "force-dynamic";

type PaymentReportPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaymentReportPage({ searchParams }: PaymentReportPageProps) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const report = await paymentReportServerApi.get(params);
  const customers = await customersServerApi.listByIds([...new Set(report.issues.map((issue) => issue.userId))]);
  return <PaymentSummaryScreen report={report} customers={customers.items} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} compareMode={parseComparisonMode(params)} />;
}
