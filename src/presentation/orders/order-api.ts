import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import type { ReorderItemsResult } from "@/src/domain/use-cases/orders/ReorderItems";
import { apiClient } from "@/src/lib/api/client";
import { ApiError } from "@/src/lib/api/ApiError";

/**
 * Typed client for the customer order *mutations*, plus the live-tracking poll.
 * UI components call these instead of touching Axios directly; each resolves
 * with domain data or rejects with a normalized `ApiError`. First-paint reads
 * are server-side (see `ordersServerApi`); admin-side order mutations live in
 * the dashboard's own `ordersApi`.
 */
export const ordersApi = {
  /**
   * Latest live tracking for an order — polled from the client while a delivery
   * is en route (the map/ETA refresh case). `null` when it can no longer be
   * tracked (404), so the poller can stop.
   */
  async getTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      const { data } = await apiClient.get<OrderTracking>(`/orders/${orderId}/tracking`);
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /** Add a past order's items back to the cart; resolves with the added/skipped counts. */
  async reorder(orderId: string): Promise<ReorderItemsResult> {
    const { data } = await apiClient.post<ReorderItemsResult>(`/orders/${orderId}/reorder`);
    return data;
  },

  /** Cancel a live, pre-dispatch order (restock + wallet refund); resolves with the updated order. */
  async cancel(orderId: string): Promise<Order> {
    const { data } = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
    return data;
  },

  /** Open a return request on a delivered order; resolves with the updated order. */
  async requestReturn(orderId: string): Promise<Order> {
    const { data } = await apiClient.post<Order>(`/orders/${orderId}/return`);
    return data;
  },
};
