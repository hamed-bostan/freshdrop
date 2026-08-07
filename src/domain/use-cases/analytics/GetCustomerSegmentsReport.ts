import { previousPeriod, rangeToWire, type DateRange } from "../../entities/Analytics";
import { CUSTOMER_SEGMENT_IDS, type CustomerSegmentPerformance, type CustomerSegmentsReport } from "../../entities/CustomerSegmentsReport";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";

export class GetCustomerSegmentsReport {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(range: DateRange, comparisonRange?: DateRange): Promise<CustomerSegmentsReport> {
    const previous = comparisonRange ?? previousPeriod(range);
    const [currentRows, previousRows, transitions] = await this.analytics.snapshot((repository) => Promise.all([
      repository.customerSegmentPerformance(range), repository.customerSegmentPerformance(previous), repository.customerSegmentTransitions(range),
    ]));
    const current = byId(currentRows);
    const baseline = byId(previousRows);
    const segments = CUSTOMER_SEGMENT_IDS.map((id) => ({ ...(current.get(id) ?? empty(id)), previousCustomers: baseline.get(id)?.customers ?? 0 }));
    const total = (rows: CustomerSegmentPerformance[]) => rows.reduce((sum, row) => sum + row.customers, 0);
    const value = (rows: CustomerSegmentPerformance[], id: typeof CUSTOMER_SEGMENT_IDS[number], field: "customers" | "revenue") => rows.find((row) => row.id === id)?.[field] ?? 0;
    return {
      range: rangeToWire(range), previousRange: rangeToWire(previous), segments,
      segmentedCustomers: total(currentRows), previousSegmentedCustomers: total(previousRows),
      activeSegments: currentRows.filter((row) => row.customers > 0).length,
      attentionSegments: currentRows.filter((row) => (row.id === "at_risk" || row.id === "dormant") && row.customers > 0).length,
      loyalRevenue: value(currentRows, "high_value_loyal", "revenue"), previousLoyalRevenue: value(previousRows, "high_value_loyal", "revenue"),
      atRiskCustomers: value(currentRows, "at_risk", "customers"), previousAtRiskCustomers: value(previousRows, "at_risk", "customers"),
      transitions,
    };
  }
}

function byId(rows: CustomerSegmentPerformance[]): Map<CustomerSegmentPerformance["id"], CustomerSegmentPerformance> { return new Map(rows.map((row) => [row.id, row])); }
function empty(id: CustomerSegmentPerformance["id"]): CustomerSegmentPerformance { return { id, customers: 0, revenue: 0, orders: 0, repeatCustomers: 0 }; }
