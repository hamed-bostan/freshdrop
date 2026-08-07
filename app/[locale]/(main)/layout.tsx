import type { Cart } from "@/src/domain/entities/Cart";
import { cartsServerApi } from "@/src/presentation/cart/cart-server-api";
import { CartProvider } from "@/src/presentation/cart/CartProvider";
import { MainNav } from "@/src/presentation/layout/MainNav";

import type { ReactNode } from "react";

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
  taxAmount: null,
  taxRate: null,
};

/**
 * Best-effort cart read that seeds the client cart cache. Navigation must always
 * render, so a failed cart read degrades to an empty cart rather than taking down
 * the whole shell. A signed-out visitor gets an empty cart (not an error).
 */
async function getInitialCart(): Promise<Cart> {
  try {
    return await cartsServerApi.get();
  } catch {
    return EMPTY_CART;
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const initialCart = await getInitialCart();

  return (
    <CartProvider initialCart={initialCart}>
      <section className="max-w-md mx-auto min-h-screen">
        <main>{children}</main>
        <MainNav />
      </section>
    </CartProvider>
  );
}
