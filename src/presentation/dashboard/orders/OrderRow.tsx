import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { focusRing, Icon } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";

/**
 * Shared grid template for the orders list — the header row and every data row use
 * it so the columns line up. Columns: customer, order id, status, placed, address,
 * total, and a trailing chevron affordance.
 */
export const ORDERS_ROW_GRID =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto_minmax(0,0.9fr)_minmax(0,1.3fr)_auto_auto] items-center gap-4";

type OrderRowProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
};

/**
 * One order in the admin list — a flat row linking to the order-detail route. No
 * inline controls: advancing the stage and resolving returns/substitutions now live
 * on the detail page, so the whole row is a single navigation target.
 */
export function OrderRow({ order, customer }: OrderRowProps) {
  const t = useTranslations("dashOrders");
  const locale = useLocale();

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      aria-label={t("viewOrderAria", { id: order.id })}
      className={cn(
        ORDERS_ROW_GRID,
        "bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50",
        focusRing,
        "focus-visible:ring-inset",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-body-b7 text-foreground">{customer?.name ?? order.userId}</span>
        {customer?.phone ? (
          <span className="block truncate text-body-b8 text-muted-foreground">{customer.phone}</span>
        ) : null}
      </span>
      <span className="truncate text-body-b7 text-muted-foreground">{order.id}</span>
      <span>
        <OrderStatusBadge status={order.status} stage={order.stage} context="admin" />
      </span>
      <span className="truncate text-body-b6 text-muted-foreground">
        {formatOrderDate(order.placedAt, locale)}
      </span>
      <span className="truncate text-body-b6 text-muted-foreground">{order.location}</span>
      <span className="text-end text-body-b7 text-foreground">
        {formatMoney(orderNetPaid(order), locale)}
      </span>
      <Icon icon={ChevronRight} size="xs" className="text-icon-muted rtl:-scale-x-100" />
    </Link>
  );
}
