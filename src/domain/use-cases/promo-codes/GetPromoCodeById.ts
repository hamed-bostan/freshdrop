import type { AdminPromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";

/** A single promo code with its campaign fields, to prefill the admin edit form. */
export class GetPromoCodeById {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  execute(id: string): Promise<AdminPromoCode | null> {
    return this.promoRepo.getById(id);
  }
}
