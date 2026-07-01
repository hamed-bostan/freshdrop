import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { apiClient } from "@/src/lib/api/client";
import type { DeliveryLocationInput } from "./delivery-location-schema";

/**
 * Typed client for the delivery-address REST *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data or
 * rejects with an `ApiError` (normalized by the Axios response interceptor in
 * `client.ts`). Reads are server-side (see `deliveryLocationsServerApi`).
 */
export const deliveryLocationsApi = {
  async create(input: DeliveryLocationInput): Promise<DeliveryLocation> {
    const { data } = await apiClient.post<DeliveryLocation>("/delivery-locations", input);
    return data;
  },
};
