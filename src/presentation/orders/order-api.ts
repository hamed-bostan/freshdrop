import type { OrderReturnRequestInput } from "@/src/contracts/order-return-schema";
import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import type { ReorderItemsResult } from "@/src/domain/use-cases/orders/ReorderItems";
import { ApiError } from "@/src/lib/api/ApiError";
import { apiGet, apiPost } from "@/src/lib/api/client";

import { orderResponseSchema, reorderResultResponseSchema } from "./order-response-schema";
import { orderTrackingResponseSchema } from "./order-tracking-response-schema";

/**
 * Typed client for the customer order *mutations*, plus the live-tracking poll.
 * UI components call these instead of touching Axios directly; each resolves with
 * domain data — validated against the endpoint's response schema — or rejects with
 * a normalized `ApiError`. First-paint reads are server-side (see
 * `ordersServerApi`); admin-side order mutations live in the dashboard's own
 * `ordersApi`.
 */
export const ordersApi = {
  /**
   * Latest live tracking for an order — polled from the client while a delivery
   * is en route (the map/ETA refresh case). `null` when it can no longer be
   * tracked (404), so the poller can stop.
   */
  async getTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      return await apiGet(`/orders/${orderId}/tracking`, orderTrackingResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /** Add a past order's items back to the cart; resolves with the added/skipped counts. */
  reorder(orderId: string): Promise<ReorderItemsResult> {
    return apiPost(`/orders/${orderId}/reorder`, undefined, reorderResultResponseSchema);
  },

  /** Cancel a live, pre-dispatch order (restock + wallet refund); resolves with the updated order. */
  cancel(orderId: string): Promise<Order> {
    return apiPost(`/orders/${orderId}/cancel`, undefined, orderResponseSchema);
  },

  /** Open a return request on a delivered order; resolves with the updated order. */
  requestReturn(orderId: string, values: OrderReturnRequestInput): Promise<Order> {
    return apiPost(`/orders/${orderId}/return`, values, orderResponseSchema);
  },
};
