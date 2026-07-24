import type { Product } from "./Product";
import type { PromoCode } from "./PromoCode";
import { promoDiscount } from "@/src/lib/promoDiscount";

export type CartItem = {
  product: Product;
  quantity: number;
}

export type Cart = {
  items: CartItem[];
  subtotal: number;
  /** Delivery fee applied at checkout. */
  shipping: number;
  /** Amount taken off the order (promo, offers). */
  discount: number;
  /** `subtotal + shipping - discount`. */
  total: number;
  itemCount: number;
}

/** Flat delivery fee while there's no zone/weight-based shipping engine. */
export const SHIPPING_FEE = 5;

/**
 * Price a set of lines — the one definition of what an order costs.
 *
 * Here rather than inside `GetCart`, where it started, because it now has two
 * callers: the shopper's cart and an order an admin places on a customer's behalf
 * over the phone. Those two must agree to the cent. A second implementation
 * beside the first is how a store ends up quietly charging different delivery
 * fees depending on which screen the order came from — and nobody finds out from
 * the code, they find out from a customer.
 *
 * Line prices come from the products passed in, which the caller must have read
 * from the catalog rather than accepted from a client. Nothing here validates
 * that; it can't. What it guarantees is that given the same lines, both paths
 * produce the same total.
 */
export function priceCart(items: CartItem[], promo?: PromoCode | null): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
