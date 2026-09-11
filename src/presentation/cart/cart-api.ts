import type { Cart } from "@/src/domain/entities/Cart";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/src/lib/api/client";

import { cartResponseSchema } from "./cart-response-schema";

/**
 * Browser client for the cart. Components call these (never Axios directly); each
 * rejects with an `ApiError` — notably status `401` when the caller isn't signed
 * in, which the UI uses to send them to login, and `EBADRESPONSE` when a body
 * doesn't match `cartResponseSchema`.
 *
 * `get` backs the client cart cache (see `useCart`); the mutations are applied
 * optimistically to that cache and reconciled by a refetch, so callers no longer
 * hand-roll a `router.refresh()` per change.
 */
export const cartsApi = {
  get(): Promise<Cart> {
    return apiGet("/cart", cartResponseSchema);
  },

  addItem(productId: string, quantity = 1): Promise<void> {
    return apiPost("/cart/items", { productId, quantity });
  },

  setQuantity(productId: string, quantity: number): Promise<void> {
    return apiPatch(`/cart/items/${productId}`, { quantity });
  },

  removeItem(productId: string): Promise<void> {
    return apiDelete(`/cart/items/${productId}`);
  },

  clear(): Promise<void> {
    return apiDelete("/cart");
  },
};
