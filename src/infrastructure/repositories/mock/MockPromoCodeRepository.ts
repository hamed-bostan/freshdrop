import type { PromoCode } from "@/src/domain/entities/PromoCode";
import type { IPromoCodeRepository } from "@/src/domain/repositories/IPromoCodeRepository";

const PROMO_CODES: PromoCode[] = [
  { id: "1", code: "SNAPP15", title: "Promo Snapp", description: "15% discount on first order", discountPercent: 15 },
  { id: "2", code: "FRESH10", title: "Fresh Welcome", description: "10% off your first groceries", discountPercent: 10 },
  { id: "3", code: "GREENS20", title: "Green Weekend", description: "20% off fresh fruit & veg", discountPercent: 20 },
  { id: "4", code: "SAVE5", title: "Saver Deal", description: "5% off any order, anytime", discountPercent: 5 },
];

export class MockPromoCodeRepository implements IPromoCodeRepository {
  async getAvailable(): Promise<PromoCode[]> {
    return PROMO_CODES;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const normalized = code.trim().toLowerCase();
    return PROMO_CODES.find((promo) => promo.code.toLowerCase() === normalized) ?? null;
  }
}
