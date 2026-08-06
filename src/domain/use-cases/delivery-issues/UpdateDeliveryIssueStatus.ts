import type { DeliveryIssue, DeliveryIssueStatus } from "../../entities/DeliveryIssue";
import type { IDeliveryIssueRepository } from "../../repositories/IDeliveryIssueRepository";

/** Move a logged issue to a new status (open → investigating → resolved, in any direction — a wrong move is corrected the same way, not undone). */
export class UpdateDeliveryIssueStatus {
  constructor(private readonly issues: IDeliveryIssueRepository) {}
  execute(id: string, status: DeliveryIssueStatus): Promise<DeliveryIssue> {
    return this.issues.updateStatus(id, status);
  }
}
