import type { Product } from "./Product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
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
