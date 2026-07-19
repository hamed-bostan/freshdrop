import type { Order } from "@/src/domain/entities/Order";
import type { Page } from "@/src/domain/entities/Pagination";
import { ApiError } from "@/src/lib/api/ApiError";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";
import { serverApiGet } from "@/src/lib/api/server-client";
import { orderListResponseSchema, orderResponseSchema } from "@/src/presentation/orders/order-response-schema";

/** What `GET /api/admin/orders` promises: a page of orders plus the total behind it. */
const orderPageResponseSchema = pageResponseSchema(orderResponseSchema);

/**
 * Server-side order reads for the admin dashboard (BFF). Unlike the storefront's
 * `ordersServerApi` (the caller's own orders), this hits the admin endpoints for
 * the cross-user view. `serverApiGet` forwards the admin's session cookie.
 */
export const ordersServerApi = {
  /**
   * Every order — for the overview's whole-history KPIs only. The order list uses
   * {@link listPage}; see the endpoint's own note on why this is temporary.
   */
  listAll(): Promise<Order[]> {
    return serverApiGet("/admin/orders/all", orderListResponseSchema);
  },

  /** One page of the order list, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<Page<Order>> {
    return serverApiGet("/admin/orders", orderPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },

  /** A single order by id; returns `null` for a missing order (404) so callers can `notFound()`. */
  async getById(id: string): Promise<Order | null> {
    try {
      return await serverApiGet(`/admin/orders/${id}`, orderResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
