import type { Cart, CartItem } from "../../entities/Cart";
import type { PromoCode } from "../../entities/PromoCode";
import type { ICartRepository } from "../../repositories/ICartRepository";
import { promoDiscount } from "@/src/lib/promoDiscount";

/** Flat delivery fee while there's no zone/weight-based shipping engine. */
const SHIPPING_FEE = 5;

export interface GetCartOptions {
  /** Applied promo code, if any — drives the discount. */
  promo?: PromoCode | null;
}

export class GetCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute({ promo }: GetCartOptions = {}): Promise<Cart> {
    const items = await this.cartRepo.getItems();
    return this.buildCart(items, promo ?? null);
  }

  private buildCart(items: CartItem[], promo: PromoCode | null): Cart {
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    // Nothing charged or discounted on an empty cart.
    const shipping = items.length > 0 ? SHIPPING_FEE : 0;
    const discount = promo && items.length > 0 ? promoDiscount(subtotal, promo.discountPercent) : 0;

    return {
      items,
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }
}
