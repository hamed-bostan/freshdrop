import type { Order } from "@/src/domain/entities/Order";
import type { Page } from "@/src/domain/entities/Pagination";
import { ApiError } from "@/src/lib/api/ApiError";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";
import { serverApiGet } from "@/src/lib/api/server-client";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";
import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import { orderCountsResponseSchema } from "./order-counts-response-schema";
import { orderMessageDefaultResponseSchema, type OrderMessageDefaultWire } from "./order-message-default-response-schema";

/** What `GET /api/admin/orders` promises: a page of orders plus the total behind it. */
const orderPageResponseSchema = pageResponseSchema(orderResponseSchema);

/**
 * Server-side order reads for the admin dashboard (BFF). Unlike the storefront's
 * `ordersServerApi` (the caller's own orders), this hits the admin endpoints for
 * the cross-user view. `serverApiGet` forwards the admin's session cookie.
 */
export const ordersServerApi = {
  // There is no `listAll`. The overview's KPIs were the only thing that ever needed
  // every order, and they now come from `GET /api/admin/analytics` as aggregates
  // computed in the database — so `/admin/orders/all` was deleted along with the
  // use-case behind it rather than left as a whole-table read anyone could reach for.

  /** One page of the order list, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<Page<Order>> {
    return serverApiGet("/admin/orders", orderPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },

  /**
   * How many orders sit at each pipeline stage, and how many there are overall —
   * the list's summary cards and its status-filter counts.
   *
   * Takes no params: these are unfiltered counts by design (see the route).
   */
  counts(): Promise<OrderPipelineCounts> {
    return serverApiGet("/admin/orders/counts", orderCountsResponseSchema);
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

  /** The ad hoc customer-message form's starting subject/body for this order (phase 4). */
  messageDefault(id: string): Promise<OrderMessageDefaultWire> {
    return serverApiGet(`/admin/orders/${id}/message-default`, orderMessageDefaultResponseSchema);
  },
};
