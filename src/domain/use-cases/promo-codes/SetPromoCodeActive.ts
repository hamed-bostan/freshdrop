import type { ActivityActor } from "../../entities/ActivityEntry";
import { singleChange } from "../../entities/ActivityEntry";
import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { recordActivity } from "../activity/recordActivity";

/**
 * Switch a campaign off (or back on) — the promo-code answer to "delete".
 *
 * Codes are never hard-deleted: a code lives on in the wild long after the
 * campaign ends (in inboxes, on cards, in screenshots), and orders were placed
 * against it. Deactivating stops it being browsed or redeemed while keeping the
 * row — and the row's redemption count — intact and reversible.
 *
 * Because this *is* the delete button, it gets its own action rather than folding
 * into `promoCode.updated`: "who turned this campaign off" is the question the log
 * will actually be opened for, and it shouldn't require reading diffs to answer.
 */
export class SetPromoCodeActive {
  constructor(
    private readonly promoRepo: IPromoCodeRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(id: string, active: boolean, actor: ActivityActor): Promise<AdminPromoCode> {
    const existing = await this.promoRepo.getById(id);
    if (!existing) throw new NotFoundError("promo code", id);

    const updated = await this.promoRepo.setActive(id, active);

    // Re-sending the state a campaign is already in isn't a change to record.
    if (existing.active !== active) {
      await recordActivity(this.activityLog, {
        actorId: actor.id,
        actorName: actor.name,
        action: "promoCode.activeChanged",
        entityType: "promoCode",
        entityId: updated.id,
        entityLabel: updated.code,
        changes: singleChange("active", existing.active, active),
      });
    }

    return updated;
  }
}
