import { apiClient } from "@/src/lib/api/client";

/**
 * Browser client for back-in-stock alert mutations. Components call these (never
 * Axios directly); each rejects with an `ApiError` — notably status `401` when the
 * caller isn't signed in, which the UI uses to send them to login.
 */
export const stockAlertsApi = {
  /** Subscribe to a product's back-in-stock alert (idempotent). */
  async subscribe(productId: string): Promise<void> {
    await apiClient.put(`/products/${productId}/stock-alert`);
  },

  /** Cancel the subscription. */
  async unsubscribe(productId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}/stock-alert`);
  },
};
