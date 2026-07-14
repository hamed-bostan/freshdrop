import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { apiDelete, apiPost, apiPut } from "@/src/lib/api/client";
import { deliveryLocationResponseSchema } from "./delivery-location-response-schema";
import type { DeliveryLocationInput } from "./delivery-location-schema";

/**
 * Typed client for the delivery-address REST *mutations*. UI components call these
 * instead of touching Axios directly; each method resolves with domain data —
 * validated against `deliveryLocationResponseSchema` — or rejects with an
 * `ApiError`. Reads are server-side (see `deliveryLocationsServerApi`).
 */
export const deliveryLocationsApi = {
  create(input: DeliveryLocationInput): Promise<DeliveryLocation> {
    return apiPost("/delivery-locations", input, deliveryLocationResponseSchema);
  },

  update(id: string, input: DeliveryLocationInput): Promise<DeliveryLocation> {
    return apiPut(`/delivery-locations/${id}`, input, deliveryLocationResponseSchema);
  },

  /** Make this address the user's checkout default; resolves with the updated address. */
  setDefault(id: string): Promise<DeliveryLocation> {
    return apiPut(`/delivery-locations/${id}/default`, undefined, deliveryLocationResponseSchema);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/delivery-locations/${id}`);
  },
};
