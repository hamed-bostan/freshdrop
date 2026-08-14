import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";
import {
  focusRing,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";

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
 * - Phones use a stacked card without horizontal scrolling.
 * - Tablet and desktop layouts use a semantic table so assistive technology can
 *   associate every value with its column heading.
 */
export async function RecentOrdersPanel({ orders, customersById }: RecentOrdersPanelProps) {
  const t = await getTranslations("dashHome");
  const tOrders = await getTranslations("dashOrders");
  const locale = await getLocale();
  const rows = orders.map((order) => ({
    order,
    customerName: customersById.get(order.userId)?.name ?? order.userId,
    href: `/dashboard/orders/${order.id}` as const,
    viewLabel: tOrders("viewOrderAria", { id: order.orderNumber }),
    amount: formatMoney(orderNetPaid(order, order.refunds), locale),
    placed: `${formatOrderDateShort(order.placedAt, locale)} ${formatOrderTime(order.placedAt, locale)}`,
  }));

  return (
    <section className="rounded-card-lg border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b1 text-foreground">{t("recentOrders")}</h2>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline">
          {t("viewAllOrders")}
          <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
        </Link>
      </div>

      {orders.length > 0 ? (
        <>
          <ul className="mt-2 divide-y divide-border sm:hidden">
            {rows.map((row) => {
              const { order } = row;
              return (
                <li key={order.id}>
                  <Link
                    href={row.href}
                    className={cn(
                      focusRing,
                      "flex items-center gap-2 py-2.5 transition-colors hover:bg-surface-sunken/50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-body-b6 text-foreground">
                        #{order.orderNumber}
                      </span>
                      <span className="block truncate text-body-b7 text-foreground">
                        {row.customerName}
                      </span>
                    </span>
                    <OrderStatusBadge status={order.status} stage={order.stage} context="admin" size="sm" />
                    <span className="flex shrink-0 flex-col items-end whitespace-nowrap text-end">
                      <span className="text-body-b7 text-foreground">
                        {row.amount}
                      </span>
                    </span>
                    <Icon icon={ChevronRight} size="xs" className="shrink-0 text-muted-foreground rtl:-scale-x-100" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 hidden overflow-x-auto sm:block">
            <Table className="min-w-[35rem] table-fixed text-body-b10">
              <TableHeader className="border-b border-border bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[14%] px-2 py-3">{tOrders("colOrder")}</TableHead>
                  <TableHead className="w-[20%] px-2 py-3">{tOrders("colCustomer")}</TableHead>
                  <TableHead className="w-[20%] px-2 py-3">{tOrders("colStatus")}</TableHead>
                  <TableHead className="w-[13%] px-2 py-3 text-end">{tOrders("colTotal")}</TableHead>
                  <TableHead className="w-[28%] px-2 py-3">{tOrders("colPlaced")}</TableHead>
                  <TableHead className="w-12 px-2 py-3"><span className="sr-only">{tOrders("colAction")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const { order } = row;
                  return (
                    <TableRow key={order.id} className="h-16">
                      <TableCell className="truncate px-2 py-3 font-mono text-foreground">#{order.orderNumber}</TableCell>
                      <TableCell className="truncate px-2 py-3 text-foreground">{row.customerName}</TableCell>
                      <TableCell className="px-2 py-3"><OrderStatusBadge status={order.status} stage={order.stage} context="admin" size="sm" /></TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-3 text-end text-foreground">{row.amount}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-3 text-foreground">{row.placed}</TableCell>
                      <TableCell className="px-0 py-2 text-end">
                        <Link
                          href={row.href}
                          aria-label={row.viewLabel}
                          className={cn(focusRing, "inline-flex size-11 items-center justify-center rounded-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground")}
                        >
                          <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <p className="mt-4 text-body-b7 text-muted-foreground">{t("noRecentOrders")}</p>
      )}
    </section>
  );
}
