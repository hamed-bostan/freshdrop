import { apiDelete, apiPut } from "@/src/lib/api/client";

/**
 * Browser client for back-in-stock alert mutations. Components call these (never
 * Axios directly); each rejects with an `ApiError` — notably status `401` when the
 * caller isn't signed in, which the UI uses to send them to login.
 *
 * Both are toggles the caller reads nothing back from, so there's no response body
 * to validate; the subscription *read* is server-side (see `stockAlertsServerApi`).
 */
export const stockAlertsApi = {
  /** Subscribe to a product's back-in-stock alert (idempotent). */
  subscribe(productId: string): Promise<void> {
    return apiPut(`/products/${productId}/stock-alert`);
  },

  /** Cancel the subscription. */
  unsubscribe(productId: string): Promise<void> {
    return apiDelete(`/products/${productId}/stock-alert`);
  },
};
