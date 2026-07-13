import type { CartItem } from "../entities/Cart";

/**
 * A user's working cart. Every operation is scoped to a `userId` — the cart is
 * per-user data (like orders and favorites), not a global singleton.
 */
export type ICartRepository = {
  // `locale` localizes the resolved product snapshots (name/unit) for display —
  // omitted or the default locale returns canonical text; see IProductRepository.
  getItems(userId: string, locale?: string): Promise<CartItem[]>;
  /** Add `quantity` of a product, accumulating onto any existing line. */
  addItem(userId: string, productId: string, quantity: number): Promise<void>;
  removeItem(userId: string, productId: string): Promise<void>;
  /** Set a line to an absolute quantity (callers clamp/validate first). */
  updateQuantity(userId: string, productId: string, quantity: number): Promise<void>;
  /** Empty the user's cart (e.g. after their order is placed). */
  clear(userId: string): Promise<void>;
}
