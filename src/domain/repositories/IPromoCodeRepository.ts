import type { PromoCode } from "../entities/PromoCode";

export interface IPromoCodeRepository {
  /** Promo codes the user can browse and apply. */
  getAvailable(): Promise<PromoCode[]>;
  /** Resolve a single code (case-insensitive); `null` if it doesn't exist. */
  findByCode(code: string): Promise<PromoCode | null>;
}
