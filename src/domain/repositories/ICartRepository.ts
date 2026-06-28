import type { CartItem } from "../entities/Cart";

export type ICartRepository = {
  getItems(): Promise<CartItem[]>;
  addItem(productId: string, quantity: number): Promise<void>;
  removeItem(productId: string): Promise<void>;
  updateQuantity(productId: string, quantity: number): Promise<void>;
  clear(): Promise<void>;
}
