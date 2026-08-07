import { auth } from "@/auth";
import { hasCustomAnalyticsRange, parseAnalyticsRange, parseComparisonMode, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { sessionHas } from "@/src/lib/require-permission";
import { deliveryIssuesServerApi } from "@/src/presentation/dashboard/reports/delivery-issues-server-api";
import { DeliveryPerformanceScreen } from "@/src/presentation/dashboard/reports/DeliveryPerformanceScreen";
import { deliveryPerformanceServerApi } from "@/src/presentation/dashboard/reports/delivery-performance-server-api";
import { deliveryZonesServerApi } from "@/src/presentation/dashboard/reports/delivery-zones-server-api";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) => (typeof value === "string" ? [[key, value] as [string, string]] : [])),
  );
  const range = parseAnalyticsRange(params);

  // The Issues & incidents panel's own search/status filter live under distinct
  // param names (`issueQ`/`issueStatus`) so they don't collide with the report's
  // date-range params, then translate to the endpoint's `q`/`status`.
  const issueParams = new URLSearchParams(params);
  const issueQ = issueParams.get("issueQ"); issueParams.delete("issueQ");
  const issueStatus = issueParams.get("issueStatus"); issueParams.delete("issueStatus");
  if (issueQ) issueParams.set("q", issueQ);
  if (issueStatus) issueParams.set("status", issueStatus);

  const [report, zoneReport, issues, session] = await Promise.all([
    deliveryPerformanceServerApi.get(params),
    deliveryZonesServerApi.get(params),
    deliveryIssuesServerApi.get(issueParams),
    auth(),
  ]);
  const canWriteIssues = await sessionHas(session, "orders.fulfill");

  return (
    <DeliveryPerformanceScreen
      report={report}
      zoneReport={zoneReport}
      issues={issues}
      canWriteIssues={canWriteIssues}
      from={toDateParam(range.from)}
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      compareMode={parseComparisonMode(params)}
    />
  );
}
