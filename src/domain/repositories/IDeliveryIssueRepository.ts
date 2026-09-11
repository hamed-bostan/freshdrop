import type { DateRange } from "../entities/Analytics";
import type { DeliveryIssue, DeliveryIssueStatus, NewDeliveryIssue } from "../entities/DeliveryIssue";

/** Narrows the report's issue list — both optional, combine with AND. */
export type DeliveryIssueFilter = { status?: DeliveryIssueStatus; search?: string };

/** Delivery incidents: read for an order or a reporting period, logged, and moved through their status workflow. */
export type IDeliveryIssueRepository = {
  /** One order's issues, newest first. */
  listForOrder(orderId: string): Promise<DeliveryIssue[]>;

  /** Issues logged in `range`, newest first, narrowed by `filter` and bounded for the report table. */
  listForReport(range: DateRange, filter: DeliveryIssueFilter, limit: number): Promise<DeliveryIssue[]>;

  /** Log an issue, snapshotting the order's currently-assigned driver onto it. */
  create(input: NewDeliveryIssue): Promise<DeliveryIssue>;

  /** Move an issue to a new status. */
  updateStatus(id: string, status: DeliveryIssueStatus): Promise<DeliveryIssue>;
};
