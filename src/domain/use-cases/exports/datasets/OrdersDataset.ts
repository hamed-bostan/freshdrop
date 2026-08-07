import type { AdminOrderFilters, AdminOrderSort } from "@/src/domain/entities/AdminOrderFilters";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid, orderRecognizedRevenue, orderRefundedTotal } from "@/src/domain/entities/Order";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import type { CsvValue } from "@/src/lib/csv";
import type { ReportDataset } from "@/src/lib/export-formats/report-dataset";

import { ExportOrders } from "../ExportOrders";

/**
 * The orders report's one section — moved verbatim from
 * `app/api/admin/exports/orders/route.ts` (same columns, same money
 * treatment), not rewritten. The single source of truth for what "the orders
 * export" contains, read by that route directly and by the job pipeline
 * (`RunExportJob`) for CSV/Excel/PDF alike.
 */
export function buildOrdersDataset(
  deps: { orders: IOrderRepository; users: IUserRepository },
  filters: AdminOrderFilters,
  sort: AdminOrderSort | undefined,
  period: string | null,
): ReportDataset {
  const orders = new ExportOrders(deps.orders, deps.users).execute(filters, sort);
  return {
    title: "orders",
    period,
    sections: [{ id: "orders", heading: "Orders", header: HEADER, rows: toRows(orders) }],
  };
}

/**
 * Money is written three ways on purpose, because the three answer different
 * questions and an export that picks one forces whoever opens it to guess:
 * `total` is what was charged, `refunded` is what went back to the wallet,
 * and `revenue` is what the store actually kept — the same
 * `orderRecognizedRevenue` the analytics aggregates sum, so a spreadsheet
 * total of this column reconciles with the dashboard.
 */
const HEADER = [
  "id",
  "placed_at",
  "status",
  "stage",
  "customer_id",
  "items",
  "units",
  "subtotal",
  "shipping",
  "discount",
  "total",
  "refunded",
  "net_paid",
  "revenue",
  "delivery_window",
  "location",
] as const;

async function* toRows(orders: AsyncIterable<Order>): AsyncGenerator<CsvValue[]> {
  for await (const order of orders) {
    yield [
      order.id,
      // ISO 8601, not a locale format: an export is machine-read as often as
      // it's eyeballed, and "07/22/2026" is ambiguous the moment it crosses a border.
      order.placedAt,
      order.status,
      order.stage ?? "",
      order.userId,
      order.items.length,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.subtotal,
      order.shipping,
      order.discount,
      order.total,
      orderRefundedTotal(order.refunds),
      orderNetPaid(order, order.refunds),
      orderRecognizedRevenue(order, order.refunds),
      order.deliveryWindow ?? "",
      order.location,
    ];
  }
}
