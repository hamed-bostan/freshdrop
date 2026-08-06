import type { DeliveryIssue, DeliveryIssueType } from "../../entities/DeliveryIssue";
import { ValidationError } from "../../errors/ValidationError";
import type { IDeliveryIssueRepository } from "../../repositories/IDeliveryIssueRepository";

/**
 * Log a delivery issue against an order. The order's currently-assigned driver is
 * snapshotted onto it by the repository (see the `DeliveryIssue` model doc);
 * unknown-order 404s bubble up from there rather than being checked twice.
 */
export class CreateDeliveryIssue {
  constructor(private readonly issues: IDeliveryIssueRepository) {}

  async execute(orderId: string, type: DeliveryIssueType, delayMinutes: number): Promise<DeliveryIssue> {
    if (!Number.isInteger(delayMinutes) || delayMinutes < 0) {
      throw new ValidationError("delayMinutes", "Delay must be a whole number of minutes, 0 or more.");
    }
    return this.issues.create({ orderId, type, delayMinutes });
  }
}
