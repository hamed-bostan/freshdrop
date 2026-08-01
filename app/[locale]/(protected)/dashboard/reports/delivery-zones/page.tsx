import { hasCustomAnalyticsRange, parseAnalyticsRange, toDateParam, toInclusiveEndParam } from "@/src/lib/api/analytics-params";
import { DeliveryZonesScreen } from "@/src/presentation/dashboard/reports/DeliveryZonesScreen";
import { deliveryPerformanceServerApi } from "@/src/presentation/dashboard/reports/delivery-performance-server-api";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DeliveryZonesPage({ searchParams }: Props) {
  const params = new URLSearchParams(Object.entries(await searchParams).flatMap(([key, value]) => typeof value === "string" ? [[key, value] as [string, string]] : []));
  const range = parseAnalyticsRange(params);
  const report = await deliveryPerformanceServerApi.get(params);
  return <DeliveryZonesScreen report={report} from={toDateParam(range.from)} to={toInclusiveEndParam(range)} isCustomRange={hasCustomAnalyticsRange(params)} />;
}
