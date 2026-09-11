import { granularityFor, previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";

import type { DeliveryPerformanceReport } from "../../entities/DeliveryPerformanceReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";
export class GetDeliveryPerformanceReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}
  async execute(range: DateRange, comparisonRange?: DateRange): Promise<DeliveryPerformanceReport> {
    const previous = comparisonRange ?? previousPeriod(range); const granularity = granularityFor(range);
    const [totals, previousTotals, series, previousSeries, lateDeliveries, drivers] = await this.analytics.snapshot((repo) => Promise.all([repo.deliveryTotals(range), repo.deliveryTotals(previous), repo.deliverySeries(range, granularity), repo.deliverySeries(previous, granularity), repo.lateDeliveries(range, 5), repo.driverPerformance(range, 5)]));
    return { range: rangeToWire(range), previousRange: rangeToWire(previous), granularity, totals, previousTotals, series, previousSeries, lateDeliveries, drivers };
  }
}
