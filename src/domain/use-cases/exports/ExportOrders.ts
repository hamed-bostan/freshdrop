import type { AdminOrderFilters, AdminOrderSort } from "../../entities/AdminOrderFilters";
import {
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
} from "../../entities/AdminOrderFilters";
import type { Order } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import { streamAllPages } from "./streamAllPages";

/**
 * Every order matching `filters`, newest first, one at a time. Backs
 * `GET /api/admin/exports/orders`.
 *
 * Takes the *same* `AdminOrderFilters` the orders screen does, and reads through
 * the same `listPage`, so "export" is precisely "the list I am looking at, as a
 * file" — a second query path would be a second definition of what a status filter
 * or a search term means, and the two would drift on the first change to either.
 *
 * Returns domain orders rather than CSV rows: which columns an export carries, and
 * how a date is written, are wire concerns the route handler owns (the domain has
 * no opinion about Excel). What belongs here is *which rows*, and that is the
 * filters.
 */
export class ExportOrders {
  constructor(private readonly orders: IOrderRepository) {}

  execute(filters: AdminOrderFilters, sort?: AdminOrderSort): AsyncGenerator<Order> {
    return streamAllPages<Order, AdminOrderSort>(
      (page) => this.orders.listPage(filters, page),
      {
        sort: sort ?? DEFAULT_ADMIN_ORDER_SORT,
        direction: DEFAULT_ADMIN_ORDER_DIRECTION,
      },
    );
  }
}
