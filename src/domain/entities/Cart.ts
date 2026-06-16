import type { Product } from "./Product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}
