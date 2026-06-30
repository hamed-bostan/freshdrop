import type { Order } from "@/src/domain/entities/Order";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side order reads for the admin dashboard (BFF). Unlike the storefront's
 * `ordersServerApi` (the caller's own orders), this hits the admin endpoint for
 * the cross-user view. `serverApiGet` forwards the admin's session cookie.
 */
export const ordersServerApi = {
  listAll(): Promise<Order[]> {
    return serverApiGet<Order[]>("/admin/orders");
  },
};
