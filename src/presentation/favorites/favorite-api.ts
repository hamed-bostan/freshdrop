import { apiClient } from "@/src/lib/api/client";

/**
 * Browser client for favorite mutations. Components call these (never Axios
 * directly); each rejects with an `ApiError` — notably status `401` when the
 * caller isn't signed in, which the UI uses to send them to login.
 */
export const favoritesApi = {
  async add(productId: string): Promise<void> {
    await apiClient.put(`/favorites/${productId}`);
  },

  async remove(productId: string): Promise<void> {
    await apiClient.delete(`/favorites/${productId}`);
  },
};
