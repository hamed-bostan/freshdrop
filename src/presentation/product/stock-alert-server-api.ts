import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import { stockAlertStatusResponseSchema } from "./stock-alert-response-schema";

/**
 * Server-side back-in-stock reads for Server Components (BFF). `serverApiGet`
 * forwards the request cookies, so these see the caller's session.
 */
export const stockAlertsServerApi = {
  /** Whether the caller is subscribed to a product's alert. `false` for anonymous users (401). */
  async isSubscribed(productId: string): Promise<boolean> {
    try {
      const { subscribed } = await serverApiGet(
        `/products/${productId}/stock-alert`,
        stockAlertStatusResponseSchema,
      );
      return subscribed;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  },
};
