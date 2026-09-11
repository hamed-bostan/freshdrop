import type { DeliveryIssue } from "../../entities/DeliveryIssue";
import type { IDeliveryIssueRepository } from "../../repositories/IDeliveryIssueRepository";

/** One order's logged delivery issues, newest first — the order detail page's issues panel. */
export class ListOrderDeliveryIssues {
  constructor(private readonly issues: IDeliveryIssueRepository) {}
  execute(orderId: string): Promise<DeliveryIssue[]> {
    return this.issues.listForOrder(orderId);
  }
}
