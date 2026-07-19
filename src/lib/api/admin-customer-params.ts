import type { AdminCustomerFilters } from "@/src/domain/entities/AdminCustomerFilters";

/**
 * The wire contract for the customers list's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-product-params.ts`.
 *
 * Query-param names: `q`, and `ids` as a comma-separated list of user ids.
 */
export function parseAdminCustomerFilters(params: URLSearchParams): AdminCustomerFilters {
  const filters: AdminCustomerFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const ids = params.get("ids");
  if (ids) {
    const userIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
    if (userIds.length) filters.userIds = userIds;
  }

  return filters;
}

export function buildAdminCustomerParams(filters: AdminCustomerFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.userIds?.length) params.set("ids", filters.userIds.join(","));
  return params;
}
