import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side order reads for Server Components (BFF). `serverApiGet` forwards the
 * request cookies, so these see the caller's session — orders are user data.
 */
export const ordersServerApi = {
  list(): Promise<Order[]> {
    return serverApiGet<Order[]>("/orders");
  },

  /** Live tracking for an order; `null` when it can't be tracked (404) so callers can `notFound()`. */
  async getTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      return await serverApiGet<OrderTracking>(`/orders/${orderId}/tracking`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
