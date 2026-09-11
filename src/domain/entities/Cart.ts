import { promoDiscount } from "@/src/lib/promoDiscount";

import { taxFromGross } from "./TaxSettings";

import type { Product } from "./Product";
import type { PromoCode } from "./PromoCode";

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
  /**
   * VAT portion of `total`, derived from non-exempt lines net of their pro-rata
   * discount share (delivery fee excluded from the taxable base). `null` when tax
   * is disabled or no rate was supplied to `priceCart` — never charged separately,
   * since prices are already tax-inclusive (see `taxFromGross`).
   */
  taxAmount: number | null;
  /** The rate `taxAmount` was computed with, snapshotted alongside it. `null` alongside `taxAmount`. */
  taxRate: number | null;
}

/** Flat delivery fee while there's no zone/weight-based shipping engine. */
export const SHIPPING_FEE = 5;

/**
 * The fraction of merchandise value a cart's discount took off — the same rule as
 * `orderDiscountRate`, computed before the order (and its own helper) exists. Used
 * to net a line's value down to what was actually paid before taxing it.
 */
export function cartDiscountRate(cart: Pick<Cart, "subtotal" | "discount">): number {
  if (!(cart.subtotal > 0)) return 0;
  return Math.min(Math.max(cart.discount / cart.subtotal, 0), 1);
}

/**
 * The VAT `item` contributes to `cart`, net of its pro-rata discount share.
 * `null` when `cart` carries no tax rate (see `Cart.taxRate`); 0 for an exempt
 * product. Exported so `placeOrder` can snapshot the same figure onto each
 * `OrderItem` without re-deriving the discount rate a second way.
 */
export function lineTaxAmount(cart: Pick<Cart, "subtotal" | "discount" | "taxRate">, item: CartItem): number | null {
  if (cart.taxRate == null) return null;
  if (item.product.taxExempt) return 0;
  const net = item.product.price * item.quantity * (1 - cartDiscountRate(cart));
  return taxFromGross(net, cart.taxRate);
}

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
 *
 * `taxRatePercent` is the store's VAT rate when enabled, or omitted/`null` when
 * it isn't — tax is derived out of the already tax-inclusive prices, so supplying
 * it never changes `total`.
 */
export function priceCart(items: CartItem[], promo?: PromoCode | null, taxRatePercent?: number | null): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Nothing charged or discounted on an empty cart.
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const discount = promo && items.length > 0 ? promoDiscount(subtotal, promo.discountPercent) : 0;

  let taxAmount: number | null = null;
  if (taxRatePercent != null && items.length > 0) {
    const discountRate = cartDiscountRate({ subtotal, discount });
    const taxableGross = items.reduce(
      (sum, item) => (item.product.taxExempt ? sum : sum + item.product.price * item.quantity),
      0,
    );
    taxAmount = taxFromGross(taxableGross * (1 - discountRate), taxRatePercent);
  }

  return {
    items,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    taxAmount,
    taxRate: taxAmount != null ? taxRatePercent! : null,
  };
}
