import type { Order } from "@/src/domain/entities/Order";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side order reads for the admin dashboard (BFF). Unlike the storefront's
 * `ordersServerApi` (the caller's own orders), this hits the admin endpoints for
 * the cross-user view. `serverApiGet` forwards the admin's session cookie.
 */
export const ordersServerApi = {
  listAll(): Promise<Order[]> {
    return serverApiGet<Order[]>("/admin/orders");
  },

  /** A single order by id; returns `null` for a missing order (404) so callers can `notFound()`. */
  async getById(id: string): Promise<Order | null> {
    try {
      return await serverApiGet<Order>(`/admin/orders/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
