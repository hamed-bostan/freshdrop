import type { ActivityActor } from "../../entities/ActivityEntry";
import { diffFields } from "../../entities/ActivityEntry";
import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IPromoCodeRepository, NewPromoCode } from "../../repositories/IPromoCodeRepository";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { assertValidPromoCode, normalizePromoCode } from "./promoCodeRules";
import { promoCodeSnapshot } from "./promoCodeActivity";
import { recordActivity } from "../activity/recordActivity";

/** Edit an existing campaign — its code, copy, discount, window and on/off switch. */
export class UpdatePromoCode {
  constructor(
    private readonly promoRepo: IPromoCodeRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(id: string, input: NewPromoCode, actor: ActivityActor): Promise<AdminPromoCode> {
    if (!id) throw new ValidationError("id", "Missing promo code id.");

    const promo = normalizePromoCode(input);
    assertValidPromoCode(promo);

    const existing = await this.promoRepo.getById(id);
    if (!existing) throw new NotFoundError("promo code", id);

    // Reject a code already owned by a *different* campaign; keeping your own is
    // fine. The DB's unique constraint still guards the check-to-update race.
    const clash = await this.promoRepo.getByCode(promo.code);
    if (clash && clash.id !== id) throw new UniqueConstraintError(["code"]);

    const updated = await this.promoRepo.update(id, promo);

    // Diffed against the stored row rather than the form's initial values, and
    // skipped entirely when nothing moved — the same rules `UpdateProduct` follows.
    const changes = diffFields(promoCodeSnapshot(existing), promoCodeSnapshot(updated));
    if (changes.length > 0) {
      await recordActivity(this.activityLog, {
        actorId: actor.id,
        actorName: actor.name,
        action: "promoCode.updated",
        entityType: "promoCode",
        entityId: updated.id,
        entityLabel: updated.code,
        changes,
      });
    }

    return updated;
  }
}
