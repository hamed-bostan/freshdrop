import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import {
  DataGridBody,
  DataGridHeader,
  DataTable,
  focusRing,
  Icon,
} from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";

/**
 * Grid template shared by this panel's header and rows. Columns: order id, status,
 * placed, address, total, and the trailing chevron affordance.
 *
 * Deliberately not `ORDERS_ROW_GRID`: that list's leading column is the customer,
 * which is the one thing every row here has in common — repeating this customer's
 * name down their own page would be pure noise.
 */
const CUSTOMER_ORDERS_ROW_GRID =
  "grid grid-cols-[minmax(0,0.9fr)_auto_minmax(0,0.9fr)_minmax(0,1.3fr)_auto_auto] items-center gap-4";

type CustomerOrdersPanelProps = {
  /** This customer's orders, newest first. */
  orders: Order[];
};

/**
 * One customer's order history, each row linking to the order-detail route — the
 * path an admin takes from "who is this?" to "what went wrong with that delivery?".
 *
 * Shows `orderNetPaid` rather than `total`: this is a per-order receipt figure, so
 * a partially refunded order should read as what the customer was left paying. The
 * lifetime tiles above use recognized revenue for the same reason in aggregate.
 */
export function CustomerOrdersPanel({ orders }: CustomerOrdersPanelProps) {
  const t = useTranslations("dashCustomerDetail");
  const tOrders = useTranslations("dashOrders");
  const locale = useLocale();

  if (orders.length === 0) {
    return (
      <p className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center text-body-b6 text-muted-foreground">
        {t("noOrders")}
      </p>
    );
  }

  return (
    <DataTable minWidthClassName="min-w-[48rem]">
      <DataGridHeader template={CUSTOMER_ORDERS_ROW_GRID}>
        <span>{tOrders("colOrder")}</span>
        <span>{tOrders("colStatus")}</span>
        <span>{tOrders("colPlaced")}</span>
        <span>{tOrders("colAddress")}</span>
        <span className="text-end">{tOrders("colTotal")}</span>
        <span aria-hidden className="w-4" />
      </DataGridHeader>
      <DataGridBody>
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/dashboard/orders/${order.id}`}
            aria-label={tOrders("viewOrderAria", { id: order.id })}
            className={cn(
              CUSTOMER_ORDERS_ROW_GRID,
              focusRing,
              "bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50",
            )}
          >
            <span className="truncate font-mono text-body-b6 text-foreground">#{order.id}</span>
            <OrderStatusBadge status={order.status} stage={order.stage} context="admin" />
            <span className="truncate text-body-b6 text-muted-foreground">
              {formatOrderDate(order.placedAt, locale)}
            </span>
            <span className="truncate text-body-b6 text-muted-foreground">
              {order.locationLabel ?? order.location}
            </span>
            <span className="text-end text-body-b8 tabular-nums text-foreground">
              {formatMoney(orderNetPaid(order), locale)}
            </span>
            <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:-scale-x-100" />
          </Link>
        ))}
      </DataGridBody>
    </DataTable>
  );
}
