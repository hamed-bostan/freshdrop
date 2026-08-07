import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

import {
  deliveryWindowListResponseSchema,
  deliveryWindowResponseSchema,
} from "./delivery-window-response-schema";

/**
 * Server-side delivery-window reads for the admin dashboard (BFF). Fetched during
 * server render so the data arrives with the page instead of after a client
 * round-trip; `serverApiGet` forwards the admin's session cookie so the admin
 * endpoint authorizes the call. Mutations go through the browser
 * `deliveryWindowsApi`, which then `router.refresh()`es to re-run these reads.
 */
export const deliveryWindowsServerApi = {
  /** The whole catalog, in display order — it's a short, hand-ordered reference list. */
  list(): Promise<DeliveryWindow[]> {
    return serverApiGet("/admin/delivery-windows", deliveryWindowListResponseSchema);
  },

  /** Resolve a window by its slug; `null` on 404 so callers can `notFound()`. */
  async getById(id: string): Promise<DeliveryWindow | null> {
    try {
      return await serverApiGet(`/admin/delivery-windows/${id}`, deliveryWindowResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
