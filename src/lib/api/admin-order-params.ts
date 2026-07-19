import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import { ORDER_STATUSES, type OrderStatus } from "@/src/domain/entities/Order";

/**
 * The wire contract for the admin order list's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-product-params.ts`.
 *
 * Query-param names: `q`, `status`. Paging and ordering ride in the same query
 * string but are parsed by `pagination-params.ts`.
 */

const STATUS_SET = new Set<string>(ORDER_STATUSES);

export function parseAdminOrderFilters(params: URLSearchParams): AdminOrderFilters {
  const filters: AdminOrderFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  // Only a status the domain actually defines, so a hand-edited URL can't filter
  // on a state no order can be in.
  const status = params.get("status");
  if (status && STATUS_SET.has(status)) filters.status = status as OrderStatus;

  return filters;
}

export function buildAdminOrderParams(filters: AdminOrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  return params;
}
