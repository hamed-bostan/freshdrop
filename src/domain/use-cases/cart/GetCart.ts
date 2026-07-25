import { priceCart, type Cart } from "../../entities/Cart";
import type { PromoCode } from "../../entities/PromoCode";
import type { ICartRepository } from "../../repositories/ICartRepository";

export type GetCartOptions = {
  /** The owner whose cart to read. */
  userId: string;
  /** Applied promo code, if any — drives the discount. */
  promo?: PromoCode | null;
  /** Locale for the resolved product snapshots (name/unit); default/omitted = canonical. */
  locale?: string;
  /** The store's VAT rate when enabled, or omitted/`null` when tax isn't in effect. */
  taxRatePercent?: number | null;
}

export class GetCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute({ userId, promo, locale, taxRatePercent }: GetCartOptions): Promise<Cart> {
    const items = await this.cartRepo.getItems(userId, locale);
    // Priced by the shared rule rather than here: an admin placing an order for a
    // customer prices the same way, and the two must agree (see `priceCart`).
    return priceCart(items, promo ?? null, taxRatePercent);
  }
}
