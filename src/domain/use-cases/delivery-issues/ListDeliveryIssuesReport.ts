import type { DateRange } from "../../entities/Analytics";
import type { DeliveryIssue } from "../../entities/DeliveryIssue";
import type { DeliveryIssueFilter, IDeliveryIssueRepository } from "../../repositories/IDeliveryIssueRepository";

/** Issues logged within a reporting period, narrowed by status/search — the delivery report's Issues & incidents panel. */
export class ListDeliveryIssuesReport {
  constructor(private readonly issues: IDeliveryIssueRepository) {}
  execute(range: DateRange, filter: DeliveryIssueFilter, limit: number): Promise<DeliveryIssue[]> {
    return this.issues.listForReport(range, filter, limit);
  }
}
