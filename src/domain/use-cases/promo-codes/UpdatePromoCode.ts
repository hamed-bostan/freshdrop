import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository, NewPromoCode } from "../../repositories/IPromoCodeRepository";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { assertValidPromoCode, normalizePromoCode } from "./promoCodeRules";

/** Edit an existing campaign — its code, copy, discount, window and on/off switch. */
export class UpdatePromoCode {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  async execute(id: string, input: NewPromoCode): Promise<AdminPromoCode> {
    if (!id) throw new ValidationError("id", "Missing promo code id.");

    const promo = normalizePromoCode(input);
    assertValidPromoCode(promo);

    const existing = await this.promoRepo.getById(id);
    if (!existing) throw new NotFoundError("promo code", id);

    // Reject a code already owned by a *different* campaign; keeping your own is
    // fine. The DB's unique constraint still guards the check-to-update race.
    const clash = await this.promoRepo.getByCode(promo.code);
    if (clash && clash.id !== id) throw new UniqueConstraintError(["code"]);

    return this.promoRepo.update(id, promo);
  }
}
