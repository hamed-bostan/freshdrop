import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IPromoCodeRepository, NewPromoCode } from "../../repositories/IPromoCodeRepository";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";
import { assertValidPromoCode, normalizePromoCode } from "./promoCodeRules";
import { promoCodeSnapshot } from "./promoCodeActivity";
import { recordActivity } from "../activity/recordActivity";

/**
 * Author a new discount campaign. The code is normalized to upper case so the
 * catalog holds one canonical spelling — redemption already matches
 * case-insensitively, and "SAVE10" next to "save10" in the admin list is two rows
 * an operator has to reason about for no reason.
 */
export class CreatePromoCode {
  constructor(
    private readonly promoRepo: IPromoCodeRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(input: NewPromoCode, actor: ActivityActor): Promise<AdminPromoCode> {
    const promo = normalizePromoCode(input);
    assertValidPromoCode(promo);

    // Code uniqueness is this use-case's invariant, enforced here so every caller
    // gets it. `getByCode` deliberately sees expired and switched-off codes too —
    // they still own their spelling. The DB's unique constraint guards the race
    // between this check and the insert, surfacing as the same error from the repo.
    const existing = await this.promoRepo.getByCode(promo.code);
    if (existing) throw new UniqueConstraintError(["code"]);

    const created = await this.promoRepo.create(promo);

    // As with a product, a creation has no "before", so the diff records what the
    // campaign started as — the discount and window someone signed off on.
    await recordActivity(this.activityLog, {
      actorId: actor.id,
      actorName: actor.name,
      action: "promoCode.created",
      entityType: "promoCode",
      entityId: created.id,
      entityLabel: created.code,
      changes: Object.entries(promoCodeSnapshot(created))
        .map(([field, value]) => ({ field, before: null, after: activityValue(value) }))
        .filter((change) => change.after !== null),
    });

    return created;
  }
}
