import {
  DEFAULT_REVENUE_RANK_SORT,
  granularityFor,
  previousPeriod,
  previousYearRange,
  rangeToWire,
  type AnalyticsOverview,
  type DateRange,
  type RevenueRankSort,
} from "../../entities/Analytics";

import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

/** How many rows the "top products" and "top categories" panels rank, when the caller doesn't say. */
const TOP_LIMIT = 5;

/** How each ranked panel orders its rows — independent, since a reader can flip one without the other. */
export type RevenueRankSortOptions = {
  productsSort?: RevenueRankSort;
  categoriesSort?: RevenueRankSort;
  /**
   * How many rows `topProducts`/`topCategories` return. Defaults to `TOP_LIMIT`,
   * the overview's compact-panel size; the analytics page's fuller tables pass a
   * larger value so they have more than five rows to paginate through.
   */
  rankLimit?: number;
};

/**
 * Everything the dashboard overview shows for one period, alongside the previous
 * period it's compared against. Backs `GET /api/admin/analytics`.
 *
 * The whole screen is one use-case and one endpoint because every figure on it has
 * to describe the same range: six independent fetches is six chances for the range
 * to drift, and one failure away from a page that half-answers the question. The
 * queries themselves are independent, so they run together — ten aggregates over
 * the same indexed range, in parallel, rather than in sequence.
 *
 * The baseline defaults to the equally-long period immediately before `range`,
 * but the caller may pass its own `comparisonRange` — the report's "Compare"
 * control resolves one off the query string (`compare=previousYear` or an
 * explicit `compareFrom`/`compareTo`) rather than this use-case guessing at it,
 * so the chosen baseline stays a fact readable from the URL, not an implicit one.
 */
export class GetAnalyticsOverview {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange, sort: RevenueRankSortOptions = {}, comparisonRange?: DateRange): Promise<AnalyticsOverview> {
    const previous = comparisonRange ?? previousPeriod(range);
    const previousYear = previousYearRange(range);
    const granularity = granularityFor(range);
    const productsSort = sort.productsSort ?? DEFAULT_REVENUE_RANK_SORT;
    const categoriesSort = sort.categoriesSort ?? DEFAULT_REVENUE_RANK_SORT;
    const rankLimit = sort.rankLimit ?? TOP_LIMIT;

    // One batch, because the numbers have to agree with each other and because
    // ten independent reads is ten connections taken from a pool the rest of
    // the dashboard is also drawing on — see `IAnalyticsRepository.snapshot`.
    const [
      totals,
      previousTotals,
      revenueSeries,
      previousSeries,
      previousYearSeries,
      statusBreakdown,
      topProducts,
      topCategories,
      customerSegments,
      previousCustomerSegments,
    ] = await this.analytics.snapshot((analytics) =>
      Promise.all([
        analytics.totals(range),
        analytics.totals(previous),
        analytics.revenueSeries(range, granularity),
        analytics.compareRevenueSeries(range, previous, granularity),
        analytics.compareRevenueSeries(range, previousYear, granularity),
        analytics.statusBreakdown(range),
        analytics.topProducts(range, rankLimit, productsSort, previous),
        analytics.topCategories(range, rankLimit, categoriesSort),
        analytics.customerSegments(range),
        analytics.customerSegments(previous),
      ]),
    );

    return {
      // Echoed back rather than left implicit: the caller may have sent a preset,
      // and the screen has to be able to say which days it is actually showing.
      range: rangeToWire(range),
      previousRange: rangeToWire(previous),
      previousYearRange: rangeToWire(previousYear),
      granularity,
      totals,
      previousTotals,
      revenueSeries,
      previousSeries,
      previousYearSeries,
      statusBreakdown,
      topProducts,
      topCategories,
      customerSegments,
      previousCustomerSegments,
    };
  }
}
