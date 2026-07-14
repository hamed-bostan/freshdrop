import { apiDelete, apiPut } from "@/src/lib/api/client";

/**
 * Browser client for favorite mutations. Components call these (never Axios
 * directly); each rejects with an `ApiError` — notably status `401` when the
 * caller isn't signed in, which the UI uses to send them to login.
 *
 * Both are toggles the caller reads nothing back from, so there's no response body
 * to validate; the favorites *reads* are server-side (see `favoritesServerApi`).
 */
export const favoritesApi = {
  add(productId: string): Promise<void> {
    return apiPut(`/favorites/${productId}`);
  },

  remove(productId: string): Promise<void> {
    return apiDelete(`/favorites/${productId}`);
  },
};
