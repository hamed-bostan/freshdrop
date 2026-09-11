import { activityValue } from "../../entities/ActivityEntry";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";

import { promoCodeSnapshot } from "./promoCodeActivity";
import { assertValidPromoCode, normalizePromoCode } from "./promoCodeRules";

import type { ActivityActor } from "../../entities/ActivityEntry";
import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository, NewPromoCode } from "../../repositories/IPromoCodeRepository";



/**
 * Author a new discount campaign. The code is normalized to upper case so the
 * catalog holds one canonical spelling — redemption already matches
 * case-insensitively, and "SAVE10" next to "save10" in the admin list is two rows
 * an operator has to reason about for no reason.
 */
export class CreatePromoCode {
  constructor(
    private readonly promoRepo: IPromoCodeRepository,
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

    // Written by the repository inside the transaction that creates the campaign,
    // so the two commit together.
    return this.promoRepo.create(promo, (created) => ({
      actorId: actor.id,
      actorName: actor.name,
      action: "promoCode.created",
      entityType: "promoCode",
      entityId: created.id,
      entityLabel: created.code,
      // As with a product, a creation has no "before", so the diff records what
      // the campaign started as — the discount and window someone signed off on.
      changes: Object.entries(promoCodeSnapshot(created))
        .map(([field, value]) => ({ field, before: null, after: activityValue(value) }))
        .filter((change) => change.after !== null),
    }));
  }
}
