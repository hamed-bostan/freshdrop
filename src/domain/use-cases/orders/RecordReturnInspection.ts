import { activityValue } from "../../entities/ActivityEntry";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

import type { ActivityActor, NewActivityEntry } from "../../entities/ActivityEntry";
import type { ReturnRequest } from "../../entities/Return";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IReturnRepository, ReturnItemInspection } from "../../repositories/IReturnRepository";


export type RecordReturnInspectionInput = {
  orderId: string;
  /** Every item's condition + recovery decision, keyed by its `ReturnItem.id`. */
  items: ReturnItemInspection[];
  /** The admin doing the inspection, for the activity log. */
  actor: ActivityActor;
};

/**
 * Record what came back on a pending return — each item's condition and what
 * happens to it — so `ResolveOrderReturn.approve` can restock only what's
 * actually resellable instead of restocking every line unconditionally.
 *
 * Optional, not a gate: an admin may approve a return without inspecting it
 * first (nothing gets restocked in that case — the safe default), or reject it
 * outright. This only records the inspection when one is done.
 */
export class RecordReturnInspection {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly returnRepo: IReturnRepository,
  ) {}

  async execute({ orderId, items, actor }: RecordReturnInspectionInput): Promise<ReturnRequest> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);
    if (order.status !== "return_requested") {
      throw new ValidationError("order", "This order has no pending return request.");
    }

    const existing = await this.returnRepo.getForOrder(orderId);
    if (!existing || existing.status === "resolved" || existing.status === "rejected") {
      throw new ValidationError("order", "This order has no pending return request.");
    }

    if (items.length === 0) {
      throw new ValidationError("items", "Record at least one item's inspection.");
    }
    const validIds = new Set(existing.items.map((item) => item.id));
    for (const item of items) {
      if (!validIds.has(item.returnItemId)) {
        throw new ValidationError("items", "One of the inspected items isn't on this return request.");
      }
    }

    return this.returnRepo.recordInspection(existing.id, items, (result) => this.entry(actor, result));
  }

  private entry(actor: ActivityActor, result: ReturnRequest): NewActivityEntry {
    return {
      actorId: actor.id,
      actorName: actor.name,
      action: "order.returnInspected",
      entityType: "order",
      entityId: result.orderId,
      entityLabel: result.orderId,
      changes: [{ field: "returnItemsInspected", before: null, after: activityValue(result.items.length) }],
    };
  }
}
