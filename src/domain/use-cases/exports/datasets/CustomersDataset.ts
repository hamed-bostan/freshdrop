import type { AdminCustomerFilters, AdminCustomerSort } from "@/src/domain/entities/AdminCustomerFilters";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import type { CsvValue } from "@/src/lib/csv";
import type { ReportDataset } from "@/src/lib/export-formats/report-dataset";
import { ExportCustomers } from "../ExportCustomers";

/**
 * The customers report's one section — moved verbatim from
 * `app/api/admin/exports/customers/route.ts`. See `OrdersDataset` for why
 * this file, not the route, is the source of truth for its columns.
 */
export function buildCustomersDataset(
  deps: { orders: IOrderRepository; users: IUserRepository },
  filters: AdminCustomerFilters,
  sort: AdminCustomerSort | undefined,
): ReportDataset {
  const customers = new ExportCustomers(deps.orders, deps.users).execute(filters, sort);
  return {
    title: "customers",
    // No period: `ExportCustomers` ranks by all-time spend, not a window.
    period: null,
    sections: [{ id: "customers", heading: "Customers", header: HEADER, rows: toRows(customers) }],
  };
}

/**
 * `rank` is the customer's position in the *full* spend ranking, so a
 * filtered export still says where each row sits overall — the same
 * guarantee the screen makes on page 2.
 */
const HEADER = ["rank", "user_id", "name", "phone", "order_count", "total_spent", "last_order_at"] as const;

async function* toRows(customers: AsyncIterable<CustomerOrderSummary>): AsyncGenerator<CsvValue[]> {
  for await (const customer of customers) {
    yield [
      customer.rank,
      customer.userId,
      customer.name,
      // Quoted like every cell, so a leading `+` on an international number is
      // preserved as text instead of being read as a formula (see `csvCell`).
      customer.phone,
      customer.orderCount,
      customer.totalSpent,
      customer.lastOrderAt,
    ];
  }
}
