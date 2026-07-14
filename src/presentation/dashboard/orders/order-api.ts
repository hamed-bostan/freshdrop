import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import type { Product } from "@/src/domain/entities/Product";
import { apiGet, apiPost, apiPut } from "@/src/lib/api/client";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";
import { orderTrackingResponseSchema } from "@/src/presentation/orders/order-tracking-response-schema";
import { productListResponseSchema } from "@/src/presentation/product/product-response-schema";
import type { OrderTrackingStageInput } from "./order-tracking-schema";
import type { OrderReturnDecisionInput } from "./order-return-schema";
import type { OrderSubstitutionInput } from "./order-substitution-schema";

/**
 * Typed client for the order REST *mutations*. UI components call these instead of
 * touching Axios directly; each method resolves with domain data — validated against
 * the response schema the endpoint promises — or rejects with an `ApiError`.
 * Reads are server-side (see `ordersServerApi`).
 */
export const ordersApi = {
  /** Advance an order's delivery stage; resolves with the refreshed tracking. */
  setTrackingStage(orderId: string, values: OrderTrackingStageInput): Promise<OrderTracking> {
    return apiPut(`/orders/${orderId}/tracking`, values, orderTrackingResponseSchema);
  },

  /** Approve or reject a pending return request; resolves with the updated order. */
  resolveReturn(orderId: string, values: OrderReturnDecisionInput): Promise<Order> {
    return apiPut(`/orders/${orderId}/return`, values, orderResponseSchema);
  },

  /**
   * Resolve an out-of-stock line while picking — substitute it for a chosen
   * replacement or refund it. Resolves with the updated order.
   */
  resolveSubstitution(orderId: string, values: OrderSubstitutionInput): Promise<Order> {
    return apiPost(`/admin/orders/${orderId}/substitutions`, values, orderResponseSchema);
  },

  /**
   * Candidate replacements a picker can substitute an out-of-stock line with —
   * products related to it (same category first). Reads the public similar-products
   * endpoint; the picker filters to what's actually on hand.
   */
  listReplacementCandidates(productId: string): Promise<Product[]> {
    return apiGet(`/products/${productId}/similar`, productListResponseSchema);
  },
};
