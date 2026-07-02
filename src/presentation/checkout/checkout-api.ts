import type { Order } from "@/src/domain/entities/Order";
import { apiClient } from "@/src/lib/api/client";
import type { PlaceOrderInput } from "./checkout-schema";

/**
 * Typed client for placing an order. The checkout screen calls this instead of
 * touching Axios directly; it resolves with the created order or rejects with an
 * `ApiError` (normalized by the Axios response interceptor in `client.ts`).
 */
export const checkoutApi = {
  async placeOrder(values: PlaceOrderInput): Promise<Order> {
    // `values` already carries the per-line substitution pre-approvals.
    const { data } = await apiClient.post<Order>("/orders", values);
    return data;
  },
};
