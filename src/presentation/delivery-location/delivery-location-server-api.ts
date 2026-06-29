import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side delivery-location reads for Server Components (BFF) — fetched from
 * the REST API during server render, like the category/product server services.
 */
export const deliveryLocationsServerApi = {
  list(): Promise<DeliveryLocation[]> {
    return serverApiGet<DeliveryLocation[]>("/delivery-locations");
  },
};
