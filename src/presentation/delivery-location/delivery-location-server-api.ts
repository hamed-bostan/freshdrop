import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import {
  deliveryLocationListResponseSchema,
  deliveryLocationResponseSchema,
} from "./delivery-location-response-schema";

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
      return await serverApiGet("/delivery-locations", deliveryLocationListResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return [];
      throw error;
    }
  },

  /**
   * Resolve one of the caller's addresses by id; `null` so the edit page can
   * `notFound()`. Both 404 (unknown/not the caller's) and 401 (signed out) read as
   * "not available to you" — the same collapse the list read makes for anonymous users.
   */
  async getById(id: string): Promise<DeliveryLocation | null> {
    try {
      return await serverApiGet(`/delivery-locations/${id}`, deliveryLocationResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
      throw error;
    }
  },
};
