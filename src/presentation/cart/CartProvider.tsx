"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Cart } from "@/src/domain/entities/Cart";
import type { Product } from "@/src/domain/entities/Product";
import { cartsApi } from "./cart-api";

/** Flat delivery fee — mirrors the server's `GetCart`. Optimistic only; the server stays authoritative. */
const SHIPPING_FEE = 5;

/** Re-derive the base cart's computed fields after an optimistic line change (no promo). */
function recomputeCart(items: Cart["items"]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  return {
    items,
    subtotal,
    shipping,
    discount: 0,
    total: subtotal + shipping,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/** Apply an absolute quantity for one product to a cart snapshot (insert / update / remove). */
function applyQuantity(cart: Cart, product: Product, quantity: number): Cart {
  if (quantity <= 0) {
    return recomputeCart(cart.items.filter((item) => item.product.id !== product.id));
  }
  const exists = cart.items.some((item) => item.product.id === product.id);
  const items = exists
    ? cart.items.map((item) => (item.product.id === product.id ? { ...item, quantity } : item))
    : [...cart.items, { product, quantity }];
  return recomputeCart(items);
}

type CartStore = {
  cart: Cart;
  /** Quantity of a single product currently in the cart (0 when absent). */
  getQuantity: (productId: string) => number;
  /**
   * Set a product's cart line to an absolute quantity (0 removes it). The store is
   * patched optimistically so the badge and every stepper for that product update
   * on the same tap; on failure it rolls back and rejects so the caller can react
   * (e.g. redirect a signed-out user to login).
   */
  setItemQuantity: (product: Product, quantity: number) => Promise<void>;
  /** Refetch the authoritative cart from the server (reconciles the badge after external changes). */
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartStore | null>(null);

/**
 * Client-side cart store: the single source of truth for the nav badge and the
 * product quantity steppers. Seeded from the server-rendered cart (so it's correct
 * on first paint — no loading flash, no client refetch waterfall) and then kept
 * live by optimistic mutations. Lives in the `(main)` layout, so its state
 * survives navigation between storefront pages.
 */
export function CartProvider({ initialCart, children }: { initialCart: Cart; children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart);
  // Mirror the latest cart in a ref so mutations read the freshest snapshot (for
  // optimistic apply + rollback) without needing it in their dependency arrays.
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const setItemQuantity = useCallback(async (product: Product, quantity: number) => {
    const previous = cartRef.current;
    setCart(applyQuantity(previous, product, quantity));
    try {
      if (quantity > 0) await cartsApi.setQuantity(product.id, quantity);
      else await cartsApi.removeItem(product.id);
    } catch (error) {
      setCart(previous); // roll back; the caller surfaces auth/network errors
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    setCart(await cartsApi.get());
  }, []);

  const value = useMemo<CartStore>(
    () => ({
      cart,
      getQuantity: (productId) => cart.items.find((item) => item.product.id === productId)?.quantity ?? 0,
      setItemQuantity,
      refresh,
    }),
    [cart, setItemQuantity, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartStore {
  const store = useContext(CartContext);
  if (!store) throw new Error("useCart must be used within a CartProvider.");
  return store;
}
