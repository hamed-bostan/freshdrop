import type { PromoCode } from "../../entities/PromoCode";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";

export class FindPromoCode {
  constructor(private readonly promoRepo: IPromoCodeRepository) {}

  execute(code: string): Promise<PromoCode | null> {
    return this.promoRepo.findByCode(code);
  }
}
