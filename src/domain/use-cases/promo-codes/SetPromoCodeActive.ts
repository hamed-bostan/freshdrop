import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Switch a campaign off (or back on) — the promo-code answer to "delete".
 *
 * Codes are never hard-deleted: a code lives on in the wild long after the
 * campaign ends (in inboxes, on cards, in screenshots), and orders were placed
 * against it. Deactivating stops it being browsed or redeemed while keeping the
 * row — and the row's redemption count — intact and reversible.
 */
export class SetPromoCodeActive {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  async execute(id: string, active: boolean): Promise<AdminPromoCode> {
    const existing = await this.promoRepo.getById(id);
    if (!existing) throw new NotFoundError("promo code", id);
    return this.promoRepo.setActive(id, active);
  }
}
