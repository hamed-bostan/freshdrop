import { previousPeriod, rangeToWire } from "@/src/domain/entities/Analytics";
import {
  hasCustomAnalyticsRange,
  parseAnalyticsRange,
  toDateParam,
  toInclusiveEndParam,
} from "@/src/lib/api/analytics-params";
import { ReportsScreen } from "@/src/presentation/dashboard/reports/ReportsScreen";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  );
  const range = parseAnalyticsRange(params);

  return (
    <ReportsScreen
      from={toDateParam(range.from)}
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      comparisonRange={rangeToWire(previousPeriod(range))}
    />
  );
}
