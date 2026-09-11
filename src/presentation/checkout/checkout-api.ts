import type { PlaceOrderInput } from "@/src/contracts/checkout-schema";
import type { Order } from "@/src/domain/entities/Order";
import { apiPost } from "@/src/lib/api/client";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";

/**
 * Typed client for placing an order. The checkout screen calls this instead of
 * touching Axios directly; it resolves with the created order — validated against
 * `orderResponseSchema` — or rejects with an `ApiError`.
 */
export const checkoutApi = {
  placeOrder(values: PlaceOrderInput): Promise<Order> {
    // `values` already carries the per-line substitution pre-approvals.
    return apiPost("/orders", values, orderResponseSchema);
  },
};
