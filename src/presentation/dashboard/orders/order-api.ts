import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import type { Product } from "@/src/domain/entities/Product";
import { apiGet, apiPatch, apiPost, apiPut } from "@/src/lib/api/client";
import {
  bulkResultSchema,
  type BulkResult,
  type OrderBulkAction,
} from "@/src/contracts/bulk-action-schema";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";
import { orderTrackingResponseSchema } from "@/src/presentation/orders/order-tracking-response-schema";
import { productListResponseSchema } from "@/src/presentation/product/product-response-schema";
import type { OrderTrackingStageInput } from "@/src/contracts/order-tracking-schema";
import type { OrderReturnDecisionInput } from "@/src/contracts/order-return-schema";
import type { OrderSubstitutionInput } from "@/src/contracts/order-substitution-schema";
import {
  orderNotificationResultSchema,
  type OrderNotificationInput,
  type OrderNotificationResult,
} from "@/src/contracts/order-notification-schema";
import type { OrderNote } from "@/src/domain/entities/OrderNote";
import { orderNoteResponseSchema, type OrderNoteInput } from "@/src/contracts/order-note-schema";

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

  /**
   * Send the customer a message about this order — a re-sent lifecycle
   * notification, a per-line substitution/refund notice, or a one-off email.
   *
   * Resolves with what was sent and how it went out, which is as much as anyone
   * can promise: the underlying channels are best-effort by contract, so this
   * confirms the send was *made*, not that it arrived.
   */
  notifyCustomer(orderId: string, values: OrderNotificationInput): Promise<OrderNotificationResult> {
    return apiPost(`/admin/orders/${orderId}/notifications`, values, orderNotificationResultSchema);
  },

  /**
   * Append an internal note to the order — staff-facing, never shown to the
   * customer. Resolves with the note as written.
   */
  addNote(orderId: string, values: OrderNoteInput): Promise<OrderNote> {
    return apiPost(`/admin/orders/${orderId}/notes`, values, orderNoteResponseSchema);
  },

  /**
   * Apply one action to a selection of orders. Resolves with how many were
   * actually moved — orders that couldn't take the action are skipped, so this
   * can be lower than `ids.length`, and the bar reports it rather than the
   * selection size.
   */
  bulkUpdate(ids: readonly string[], action: OrderBulkAction): Promise<BulkResult> {
    return apiPatch("/admin/orders/bulk", { ids, action }, bulkResultSchema);
  },
};
