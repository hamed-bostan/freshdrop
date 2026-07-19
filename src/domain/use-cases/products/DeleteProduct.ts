import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IActivityLog } from "../../repositories/IActivityLog";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";
import { productSnapshot } from "./productActivity";
import { recordActivity } from "../activity/recordActivity";

export class DeleteProduct {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(id: string, actor: ActivityActor): Promise<void> {
    if (!id) throw new ValidationError("id", "Missing product id.");

    const existing = await this.productRepo.getById(id);
    if (!existing) throw new NotFoundError("product", id);

    await this.productRepo.delete(id);

    // The one entry whose "before" is the whole point: after this runs, the
    // product row is gone and the log is the only place its name, price and level
    // still exist. So the diff records every tracked field moving to nothing,
    // rather than the empty list a delete would otherwise produce.
    const snapshot = productSnapshot(existing);
    await recordActivity(this.activityLog, {
      actorId: actor.id,
      actorName: actor.name,
      action: "product.deleted",
      entityType: "product",
      entityId: id,
      entityLabel: existing.name,
      changes: Object.entries(snapshot)
        .map(([field, value]) => ({ field, before: activityValue(value), after: null }))
        .filter((change) => change.before !== null),
    });
  }
}
