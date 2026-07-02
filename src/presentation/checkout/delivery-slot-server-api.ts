import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side delivery-slot reads for Server Components (BFF) — fetched from the
 * REST API during server render, like the payment-method/category server services.
 */
export const deliverySlotsServerApi = {
  list(): Promise<DeliverySlotDay[]> {
    return serverApiGet<DeliverySlotDay[]>("/delivery-slots");
  },
};
