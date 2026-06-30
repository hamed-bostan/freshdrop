import { apiClient } from "@/src/lib/api/client";

/**
 * Browser client for cart mutations. Components call these (never Axios directly);
 * each rejects with an `ApiError` — notably status `401` when the caller isn't
 * signed in, which the UI uses to send them to login. After a successful call the
 * caller triggers `router.refresh()` so the server re-renders the authoritative
 * cart (never patch a local copy).
 */
export const cartsApi = {
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
