import {
  granularityFor,
  previousPeriod,
  rangeToWire,
  type DateRange,
} from "../../entities/Analytics";

import type { PaymentReport } from "../../entities/PaymentReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

const PAYMENT_ISSUE_LIMIT = 5;

/** Builds the complete payment report from one consistent database snapshot. */
export class GetPaymentReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange, comparisonRange?: DateRange): Promise<PaymentReport> {
    const previous = comparisonRange ?? previousPeriod(range);
    const granularity = granularityFor(range);
    const [totals, previousTotals, series, previousSeries, issues] =
      await this.analytics.snapshot((analytics) =>
        Promise.all([
          analytics.paymentTotals(range),
          analytics.paymentTotals(previous),
          analytics.paymentSeries(range, granularity),
          analytics.comparePaymentSeries(range, previous, granularity),
          analytics.paymentIssues(range, PAYMENT_ISSUE_LIMIT),
        ]),
      );

    return {
      range: rangeToWire(range),
      previousRange: rangeToWire(previous),
      granularity,
      totals,
      previousTotals,
      series,
      previousSeries,
      issues,
    };
  }
}
