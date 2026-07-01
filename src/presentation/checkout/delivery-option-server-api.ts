import type { DeliveryOption } from "@/src/domain/entities/DeliveryOption";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side delivery-option reads for Server Components (BFF) — fetched from the
 * REST API during server render, like the payment-method/category server services.
 */
export const deliveryOptionsServerApi = {
  list(): Promise<DeliveryOption[]> {
    return serverApiGet<DeliveryOption[]>("/delivery-options");
  },
};
