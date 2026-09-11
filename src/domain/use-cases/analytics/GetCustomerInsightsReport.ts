import { granularityFor, previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";

import type { CustomerInsightsReport } from "../../entities/CustomerInsightsReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

const COHORT_LIMIT = 5;

/** Builds one consistent customer snapshot for every panel in the report. */
export class GetCustomerInsightsReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange, comparisonRange?: DateRange): Promise<CustomerInsightsReport> {
    const previous = comparisonRange ?? previousPeriod(range);
    const granularity = granularityFor(range);
    const [totals, previousTotals, segments, previousSegments, growth, previousGrowth, frequency, cohorts] = await this.analytics.snapshot((repository) => Promise.all([
      repository.totals(range), repository.totals(previous), repository.customerSegments(range), repository.customerSegments(previous),
      repository.customerGrowthSeries(range, granularity), repository.customerGrowthSeries(previous, granularity), repository.purchaseFrequency(range), repository.retentionCohorts(range, COHORT_LIMIT),
    ]));
    return { range: rangeToWire(range), previousRange: rangeToWire(previous), granularity, totals, previousTotals, segments, previousSegments, growth, previousGrowth, frequency, cohorts };
  }
}
