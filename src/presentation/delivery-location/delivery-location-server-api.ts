import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side delivery-location reads for Server Components (BFF) — fetched from
 * the REST API during server render, like the category/product server services.
 *
 * Addresses are per-user (the endpoint is auth-gated), but the list is read on
 * public screens too (the home header's region selector). So an anonymous 401 is
 * swallowed into an empty list rather than surfaced as an error — the caller just
 * renders with no saved addresses; any other failure still propagates.
 */
export const deliveryLocationsServerApi = {
  async list(): Promise<DeliveryLocation[]> {
    try {
      return await serverApiGet<DeliveryLocation[]>("/delivery-locations");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return [];
      throw error;
    }
  },
};
