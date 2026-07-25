import { analyticsServerApi } from "@/src/presentation/dashboard/analytics/analytics-server-api";
import {
  AnalyticsScreen,
  ANALYTICS_RANK_LIMIT,
} from "@/src/presentation/dashboard/analytics/AnalyticsScreen";
import {
  hasCustomAnalyticsRange,
  parseAnalyticsRange,
  parseRevenueRankSort,
  toDateParam,
  toInclusiveEndParam,
} from "@/src/lib/api/analytics-params";

// Read from the REST API (BFF) per request, same as the overview it complements.
export const dynamic = "force-dynamic";

type DashboardAnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Parse a 1-based page number off the query string, falling back to page 1 for anything absent or invalid. */
function parseRankPage(params: URLSearchParams, paramName: string): number {
  const page = Math.floor(Number(params.get(paramName)));
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function DashboardAnalyticsPage({ searchParams }: DashboardAnalyticsPageProps) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  );

  const range = parseAnalyticsRange(params);
  const productSort = parseRevenueRankSort(params, "productSort");
  const categorySort = parseRevenueRankSort(params, "categorySort");
  const productsPage = parseRankPage(params, "productsPage");
  const categoriesPage = parseRankPage(params, "categoriesPage");

  // The one difference from the overview's own fetch of the same endpoint: this
  // page asks for a fuller ranking (up to `ANALYTICS_RANK_LIMIT` rows) to page
  // through, rather than the overview's three-row teaser.
  const rankParams = new URLSearchParams(params);
  rankParams.set("rankLimit", String(ANALYTICS_RANK_LIMIT));
  const analytics = await analyticsServerApi.getOverview(rankParams);

  return (
    <AnalyticsScreen
      analytics={analytics}
      from={toDateParam(range.from)}
      to={toInclusiveEndParam(range)}
      isCustomRange={hasCustomAnalyticsRange(params)}
      productSort={productSort}
      categorySort={categorySort}
      productsPage={productsPage}
      categoriesPage={categoriesPage}
    />
  );
}
