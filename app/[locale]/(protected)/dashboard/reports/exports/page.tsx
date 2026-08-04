import { auth } from "@/auth";
import { hasCustomAnalyticsRange, parseAnalyticsRange, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { sessionPermissions } from "@/src/lib/require-permission";
import { ExportReportsScreen } from "@/src/presentation/dashboard/reports/ExportReportsScreen";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ExportReportsPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const session = await auth();
  const permissions = await sessionPermissions(session);
  return <ExportReportsScreen from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} permissions={permissions} />;
}
