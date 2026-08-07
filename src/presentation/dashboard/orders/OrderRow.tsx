import { Store, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { maskPhoneNumber } from "@/src/lib/maskPhoneNumber";
import { BulkRowCheckbox } from "@/src/presentation/dashboard/bulk";
import { TableCell, TableRow } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";

import { OrderRowActions } from "./OrderRowActions";

type OrderRowProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
  /** Whether to offer the selection checkbox — see `OrdersTable`. */
  canFulfill: boolean;
};

/**
 * One order in the admin list.
 *
 * The row used to be a single `<Link>` — which is why this table was a CSS grid
 * rather than table markup, a `<tr>` being unable to be one. It can't be any
 * more: the row now carries a selection checkbox and an actions menu, and a link
 * containing controls is neither valid HTML nor operable by keyboard (there is no
 * way to reach those controls without activating the link). So the row is a real
 * `<tr>` again, and the order id is the link.
 *
 * The trade is deliberate. Losing whole-row click costs a large, forgiving target;
 * keeping it costs the row every control it needs from here on — this phase's
 * menu, the next one's checkbox. The affordance goes where it can be used.
 */
export function OrderRow({ order, customer, canFulfill }: OrderRowProps) {
  const t = useTranslations("dashOrders");
  const locale = useLocale();

  const DeliveryIcon = order.deliveryType === "pickup" ? Store : Truck;

  return (
    <TableRow>
      {canFulfill ? (
        <TableCell>
          <BulkRowCheckbox id={order.id} label={t("selectRowAria", { id: order.orderNumber })} />
        </TableCell>
      ) : null}

      <TableCell>
        <Link
          href={`/dashboard/orders/${order.id}`}
          aria-label={t("viewOrderAria", { id: order.orderNumber })}
          className="text-body-b7 text-primary hover:underline"
        >
          #{order.orderNumber}
        </Link>
      </TableCell>

      <TableCell>
        <span className="block max-w-48 truncate text-body-b7 text-foreground">
          {customer?.name ?? order.userId}
        </span>
        {customer?.phone ? (
          // `dir="ltr"` because a phone number is digits and reads left-to-right
          // even in an RTL row; without it the leading zero lands on the wrong end.
          <span dir="ltr" className="block truncate text-body-b8 text-muted-foreground">
            {maskPhoneNumber(customer.phone)}
          </span>
        ) : null}
      </TableCell>

      <TableCell>
        <OrderStatusBadge status={order.status} stage={order.stage} context="admin" />
      </TableCell>

      <TableCell>
        <span className="flex items-center gap-2 whitespace-nowrap text-body-b6 text-muted-foreground">
          <DeliveryIcon aria-hidden className="size-4 shrink-0" />
          {order.deliveryType === "pickup" ? t("deliveryPickup") : t("deliveryCouriered")}
        </span>
      </TableCell>

      <TableCell>
        {/* Date and time on separate lines: sorted by date, the column is scanned
            down the day and only read across to the time once a day matters. */}
        <span className="block whitespace-nowrap text-body-b6 text-foreground">
          {formatOrderDateShort(order.placedAt, locale)}
        </span>
        <span className="block whitespace-nowrap text-body-b8 text-muted-foreground">
          {formatOrderTime(order.placedAt, locale)}
        </span>
      </TableCell>

      {/* Money is compared down the column, so it aligns to the end of the cell
          and never wraps. */}
      <TableCell className="whitespace-nowrap text-end text-body-b7 text-foreground">
        {formatMoney(orderNetPaid(order, order.refunds), locale)}
      </TableCell>

      <TableCell>
        <div className="flex justify-end">
          <OrderRowActions orderId={order.id} customerId={customer?.userId} />
        </div>
      </TableCell>
    </TableRow>
  );
}
