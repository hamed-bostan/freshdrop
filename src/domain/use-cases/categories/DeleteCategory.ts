import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { ICategoryRepository } from "../../repositories/ICategoryRepository";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";
import { categorySnapshot } from "./categoryActivity";
import { recordActivity } from "../activity/recordActivity";

export class DeleteCategory {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly imageStorage: IImageStorageRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(id: string, actor: ActivityActor): Promise<void> {
    if (!id) throw new ValidationError("id", "Missing category id.");

    const existing = await this.categoryRepo.getById(id);
    if (!existing) throw new NotFoundError("category", id);

    await this.categoryRepo.delete(id);

    // As with a deleted product: once the row is gone the log is the only place
    // this category's name and slug still exist, so the diff records every tracked
    // field moving to nothing rather than the empty list a delete would produce.
    const snapshot = categorySnapshot(existing);
    await recordActivity(this.activityLog, {
      actorId: actor.id,
      actorName: actor.name,
      action: "category.deleted",
      entityType: "category",
      entityId: id,
      entityLabel: existing.name,
      changes: Object.entries(snapshot)
        .map(([field, value]) => ({ field, before: activityValue(value), after: null }))
        .filter((change) => change.before !== null),
    });

    // Reclaim the now-orphaned icon (best-effort: never blocks the delete).
    await this.imageStorage.removeByUrl(existing.iconUrl);
  }
}
