import type { AdminOrderFilters, AdminOrderSort } from "../../entities/AdminOrderFilters";
import type { Order } from "../../entities/Order";
import type { Page, PageRequest } from "../../entities/Pagination";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { resolveOrderSearch } from "./resolveOrderSearch";

/**
 * One page of the admin order-tracking list. Backs `GET /api/admin/orders`.
 *
 * The only way to read the cross-user order list: the whole-history counterpart
 * (`GetAllOrders`) is gone, along with the endpoint behind it — the overview's KPIs
 * that needed it are now aggregate queries (see `IAnalyticsRepository`).
 *
 * Takes the user repository only to resolve a search term to the customers it
 * names (see `resolveOrderSearch`); nothing else here reads a user.
 */
export class ListOrders {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    filters: AdminOrderFilters,
    page: PageRequest<AdminOrderSort>,
  ): Promise<Page<Order>> {
    return this.orderRepo.listPage(await resolveOrderSearch(filters, this.userRepo), page);
  }
}
