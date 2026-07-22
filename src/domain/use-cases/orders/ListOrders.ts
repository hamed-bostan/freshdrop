import type { AdminOrderFilters, AdminOrderSort } from "../../entities/AdminOrderFilters";
import type { Order } from "../../entities/Order";
import type { Page, PageRequest } from "../../entities/Pagination";
import type { IOrderRepository } from "../../repositories/IOrderRepository";

/**
 * One page of the admin order-tracking list. Backs `GET /api/admin/orders`.
 *
 * The only way to read the cross-user order list: the whole-history counterpart
 * (`GetAllOrders`) is gone, along with the endpoint behind it — the overview's KPIs
 * that needed it are now aggregate queries (see `IAnalyticsRepository`). A blank
 * search term normalises to "no term" so `?q=` behaves like an unfiltered list.
 */
export class ListOrders {
  constructor(private readonly orderRepo: IOrderRepository) {}

  execute(filters: AdminOrderFilters, page: PageRequest<AdminOrderSort>): Promise<Page<Order>> {
    const query = filters.query?.trim() ?? "";
    return this.orderRepo.listPage({ ...filters, query: query || undefined }, page);
  }
}
