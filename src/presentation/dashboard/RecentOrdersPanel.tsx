import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";
import { DataGridBody, DataGridHeader, DataTable, focusRing, Icon } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";

/**
 * Grid template shared by the desktop header and rows. Columns: order id,
 * customer, status, placed, amount, and the trailing chevron affordance — same
 * "row is a link" shape as `CustomerOrdersPanel`, which is why this is a grid
 * rather than the orders list's `<table>` (a `<tr>` can't be one link).
 */
const RECENT_ORDERS_ROW_GRID =
  "grid grid-cols-[minmax(0,.55fr)_minmax(0,.9fr)_auto_minmax(0,.75fr)_auto_auto] items-center gap-2";

type RecentOrdersPanelProps = {
  /** The latest few orders — a page, not the history. */
  orders: Order[];
  /** Summaries for exactly `orders`' customers, to label each row with who placed it. */
  customersById: Map<string, CustomerOrderSummary>;
};

/**
 * The overview's "what just happened" panel. Two layouts of the same rows,
 * not one table squeezed to fit both:
 *
 * - Below `sm`, a five-column grid with a header row needs a `min-w-[30rem]`
 *   scroll frame to stay legible on a phone — the header truncates and a
 *   horizontal scrollbar appears before the row's own content does. A stacked
 *   card (id + customer, badge, amount + date, chevron) fits the viewport
 *   outright and drops the header, which a single glance down the column
 *   already makes redundant.
 * - `sm` and up keep the grid/table, where the columns have room to align.
 */
export async function RecentOrdersPanel({ orders, customersById }: RecentOrdersPanelProps) {
  const t = await getTranslations("dashHome");
  const tOrders = await getTranslations("dashOrders");
  const locale = await getLocale();

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{t("recentOrders")}</h2>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline">
          {t("viewAll")}
          <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
        </Link>
      </div>

      {orders.length > 0 ? (
        <>
          <ul className="mt-2 divide-y divide-border sm:hidden">
            {orders.map((order) => {
              const customer = customersById.get(order.userId);
              return (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    aria-label={tOrders("viewOrderAria", { id: order.orderNumber })}
                    className={cn(
                      focusRing,
                      "flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-sunken/50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-body-b6 text-foreground">
                        #{order.orderNumber}
                      </span>
                      <span className="block truncate text-body-b7 text-foreground">
                        {customer?.name ?? order.userId}
                      </span>
                    </span>
                    <OrderStatusBadge status={order.status} stage={order.stage} context="admin" size="sm" />
                    <span className="flex shrink-0 flex-col items-end whitespace-nowrap text-end">
                      <span className="text-body-b7 text-foreground">
                        {formatMoney(orderNetPaid(order, order.refunds), locale)}
                      </span>
                      <span className="text-body-b8 text-muted-foreground">
                        {formatOrderDateShort(order.placedAt, locale)}
                      </span>
                    </span>
                    <Icon icon={ChevronRight} size="xs" className="shrink-0 text-muted-foreground rtl:-scale-x-100" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <DataTable className="mt-3 hidden sm:block" minWidthClassName="min-w-[30rem]">
            <DataGridHeader template={RECENT_ORDERS_ROW_GRID}>
              <span>{tOrders("colOrder")}</span>
              <span>{tOrders("colCustomer")}</span>
              <span>{tOrders("colStatus")}</span>
              <span>{tOrders("colPlaced")}</span>
              <span className="text-end">{tOrders("colTotal")}</span>
              <span aria-hidden className="w-4" />
            </DataGridHeader>
            <DataGridBody>
              {orders.map((order) => {
                const customer = customersById.get(order.userId);
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    aria-label={tOrders("viewOrderAria", { id: order.orderNumber })}
                    className={cn(
                      RECENT_ORDERS_ROW_GRID,
                      focusRing,
                      "bg-background px-4 py-2 transition-colors hover:bg-surface-sunken/50",
                    )}
                  >
                    <span className="truncate font-mono text-body-b6 text-foreground">
                      #{order.orderNumber}
                    </span>
                    <span className="truncate text-body-b7 text-foreground">
                      {customer?.name ?? order.userId}
                    </span>
                    <OrderStatusBadge status={order.status} stage={order.stage} context="admin" size="sm" />
                    <span className="flex flex-col whitespace-nowrap text-body-b8 text-muted-foreground">
                      <span className="text-foreground">{formatOrderDateShort(order.placedAt, locale)}</span>
                      {formatOrderTime(order.placedAt, locale)}
                    </span>
                    <span className="whitespace-nowrap text-end text-body-b7 text-foreground">
                      {formatMoney(orderNetPaid(order, order.refunds), locale)}
                    </span>
                    <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:-scale-x-100" />
                  </Link>
                );
              })}
            </DataGridBody>
          </DataTable>
        </>
      ) : (
        <p className="mt-4 text-body-b7 text-muted-foreground">{t("noRecentOrders")}</p>
      )}
    </section>
  );
}
