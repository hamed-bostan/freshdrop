import { granularityFor, previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";
import type { RefundReport } from "../../entities/RefundReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

const CASE_LIMIT = 5;
const REASON_LIMIT = 5;

/** Builds the refunds report from a repeatable-read analytics snapshot. */
export class GetRefundReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange): Promise<RefundReport> {
    const previous = previousPeriod(range);
    const granularity = granularityFor(range);
    const [totals, previousTotals, series, previousSeries, reasons, cases, returnBreakdown] = await this.analytics.snapshot((repository) => Promise.all([
      repository.refundTotals(range), repository.refundTotals(previous),
      repository.refundSeries(range, granularity), repository.compareRefundSeries(range, previous, granularity),
      repository.refundReasons(range, REASON_LIMIT), repository.refundCases(range, CASE_LIMIT),
      repository.returnBreakdown(range),
    ]));
    return { range: rangeToWire(range), previousRange: rangeToWire(previous), granularity, totals, previousTotals, series, previousSeries, reasons, cases, returnBreakdown };
  }
}
