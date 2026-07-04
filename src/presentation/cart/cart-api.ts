import type { Cart } from "@/src/domain/entities/Cart";
import { apiClient } from "@/src/lib/api/client";

/**
 * Browser client for the cart. Components call these (never Axios directly); each
 * rejects with an `ApiError` — notably status `401` when the caller isn't signed
 * in, which the UI uses to send them to login.
 *
 * `get` backs the client cart cache (see `useCart`); the mutations are applied
 * optimistically to that cache and reconciled by a refetch, so callers no longer
 * hand-roll a `router.refresh()` per change.
 */
export const cartsApi = {
  async get(): Promise<Cart> {
    const { data } = await apiClient.get<Cart>("/cart");
    return data;
  },

  async addItem(productId: string, quantity = 1): Promise<void> {
    await apiClient.post("/cart/items", { productId, quantity });
  },

  async setQuantity(productId: string, quantity: number): Promise<void> {
    await apiClient.patch(`/cart/items/${productId}`, { quantity });
  },

  async removeItem(productId: string): Promise<void> {
    await apiClient.delete(`/cart/items/${productId}`);
  },
};
