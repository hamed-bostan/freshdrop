import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import { apiClient } from "@/src/lib/api/client";
import type { OrderTrackingStageInput } from "./order-tracking-schema";
import type { OrderReturnDecisionInput } from "./order-return-schema";

/**
 * Typed client for the order REST *mutations*. UI components call these instead of
 * touching Axios directly; each method resolves with domain data or rejects with
 * an `ApiError` (normalized by the Axios response interceptor in `client.ts`).
 * Reads are server-side (see `ordersServerApi`).
 */
export const ordersApi = {
  /** Advance an order's delivery stage; resolves with the refreshed tracking. */
  async setTrackingStage(orderId: string, values: OrderTrackingStageInput): Promise<OrderTracking> {
    const { data } = await apiClient.put<OrderTracking>(`/orders/${orderId}/tracking`, values);
    return data;
  },

  /** Approve or reject a pending return request; resolves with the updated order. */
  async resolveReturn(orderId: string, values: OrderReturnDecisionInput): Promise<Order> {
    const { data } = await apiClient.put<Order>(`/orders/${orderId}/return`, values);
    return data;
  },
};
