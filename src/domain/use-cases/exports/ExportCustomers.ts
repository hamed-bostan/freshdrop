import type { AdminCustomerFilters, AdminCustomerSort } from "../../entities/AdminCustomerFilters";
import {
  DEFAULT_ADMIN_CUSTOMER_DIRECTION,
  DEFAULT_ADMIN_CUSTOMER_SORT,
} from "../../entities/AdminCustomerFilters";
import type { CustomerOrderSummary } from "../../entities/CustomerOrderSummary";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { ListCustomerSummaries } from "../orders/ListCustomerSummaries";
import { streamAllPages } from "./streamAllPages";

/**
 * Every customer matching `filters`, ranked by spend, one at a time. Backs
 * `GET /api/admin/exports/customers`.
 *
 * Goes through {@link ListCustomerSummaries} rather than around it, so the export
 * carries the same ranking, the same search semantics and the same `rank` the
 * screen shows — see {@link ExportOrders} for why an export must not be a second
 * query path.
 *
 * One honest caveat, inherited rather than introduced: those summaries are derived
 * from the whole order history per call, because there is no customers table to
 * page (see `ListCustomerSummaries`). Streaming the pages here therefore bounds
 * what is held *for the response*, not what the aggregation costs underneath. That
 * read becomes cheap when the customer ranking moves into SQL alongside the other
 * aggregates — at which point this use-case is unchanged, which is the point of
 * calling through the port.
 */
export class ExportCustomers {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly users: IUserRepository,
  ) {}

  execute(filters: AdminCustomerFilters, sort?: AdminCustomerSort): AsyncGenerator<CustomerOrderSummary> {
    const list = new ListCustomerSummaries(this.orders, this.users);

    return streamAllPages<CustomerOrderSummary, AdminCustomerSort>(
      (page) => list.execute(filters, page),
      {
        sort: sort ?? DEFAULT_ADMIN_CUSTOMER_SORT,
        direction: DEFAULT_ADMIN_CUSTOMER_DIRECTION,
      },
    );
  }
}
