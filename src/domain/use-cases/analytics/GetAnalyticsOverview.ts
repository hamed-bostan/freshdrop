import {
  granularityFor,
  previousPeriod,
  rangeToWire,
  type AnalyticsOverview,
  type DateRange,
} from "../../entities/Analytics";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

/** How many rows the "top products" and "top categories" panels rank. */
const TOP_LIMIT = 5;

/**
 * Everything the dashboard overview shows for one period, alongside the previous
 * period it's compared against. Backs `GET /api/admin/analytics`.
 *
 * The whole screen is one use-case and one endpoint because every figure on it has
 * to describe the same range: six independent fetches is six chances for the range
 * to drift, and one failure away from a page that half-answers the question. The
 * queries themselves are independent, so they run together — seven aggregates over
 * the same indexed range, in parallel, rather than in sequence.
 *
 * The baseline is chosen here rather than by the caller. "Compared to what" is a
 * property of the comparison, not of the request; letting the query string carry
 * its own baseline would make every delta on the page unverifiable from the URL.
 */
export class GetAnalyticsOverview {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange): Promise<AnalyticsOverview> {
    const previous = previousPeriod(range);
    const granularity = granularityFor(range);

    const [totals, previousTotals, revenueSeries, statusBreakdown, topProducts, topCategories] =
      await Promise.all([
        this.analytics.totals(range),
        this.analytics.totals(previous),
        this.analytics.revenueSeries(range, granularity),
        this.analytics.statusBreakdown(range),
        this.analytics.topProducts(range, TOP_LIMIT),
        this.analytics.topCategories(range, TOP_LIMIT),
      ]);

    return {
      // Echoed back rather than left implicit: the caller may have sent a preset,
      // and the screen has to be able to say which days it is actually showing.
      range: rangeToWire(range),
      previousRange: rangeToWire(previous),
      granularity,
      totals,
      previousTotals,
      revenueSeries,
      statusBreakdown,
      topProducts,
      topCategories,
    };
  }
}
