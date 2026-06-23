import type { PromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";

export class GetPromoCodes {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  execute(): Promise<PromoCode[]> {
    return this.promoRepo.getAvailable();
  }
}
