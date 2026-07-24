import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { Order } from "@/src/domain/entities/Order";
import { apiGet, apiPost } from "@/src/lib/api/client";
import type { AdminOrderInput } from "@/src/contracts/admin-order-schema";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";
import { deliverySlotDayListResponseSchema } from "@/src/presentation/checkout/delivery-slot-response-schema";

/**
 * Browser client for the admin create-order flow.
 *
 * The create screen is a client component — it holds an unsubmitted form of
 * pickers that fetch as someone types — so it reads over the browser Axios client
 * rather than server-rendering. The delivery slots come from the same public
 * endpoint the storefront checkout uses, since "what can be booked" is one answer.
 */
export const createOrderApi = {
  /** The bookable delivery days, same source as storefront checkout. */
  listSlots(): Promise<DeliverySlotDay[]> {
    return apiGet("/delivery-slots", deliverySlotDayListResponseSchema);
  },

  /** Place the order. Resolves with the created order, or rejects with an `ApiError` carrying field errors. */
  create(values: AdminOrderInput): Promise<Order> {
    return apiPost("/admin/orders", values, orderResponseSchema);
  },
};
