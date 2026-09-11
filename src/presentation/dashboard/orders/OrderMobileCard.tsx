import { Store, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { orderNetPaid, type Order } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { maskPhoneNumber } from "@/src/lib/maskPhoneNumber";
import { BulkRowCheckbox } from "@/src/presentation/dashboard/bulk";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";

import { OrderRowActions } from "./OrderRowActions";

/** Compact order view retains every table field and action on narrow canvases. */
export function OrderMobileCard({ order, customer, canFulfill }: {
  order: Order;
  customer: CustomerOrderSummary | undefined;
  canFulfill: boolean;
}) {
  const t = useTranslations("dashOrders");
  const locale = useLocale();
  const DeliveryIcon = order.deliveryType === "pickup" ? Store : Truck;

  return (
    <article aria-label={t("viewOrderAria", { id: order.orderNumber })} className="min-w-0 rounded-card-lg border border-border bg-background p-4">
      <div className="flex min-w-0 items-center gap-3">
        {canFulfill && <label className="-ms-3 flex size-11 shrink-0 items-center justify-center"><BulkRowCheckbox id={order.id} label={t("selectRowAria", { id: order.orderNumber })} /></label>}
        <Link href={`/dashboard/orders/${order.id}`} aria-label={t("viewOrderAria", { id: order.orderNumber })}
          className="flex min-h-11 min-w-0 flex-1 items-center break-all py-2 text-body-b7 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          #{order.orderNumber}
        </Link>
        <OrderRowActions orderId={order.id} customerId={customer?.userId} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <OrderStatusBadge status={order.status} stage={order.stage} context="admin" />
        <span className="flex items-center gap-1.5 text-body-b8 text-muted-foreground">
          <DeliveryIcon aria-hidden className="size-3.5 shrink-0" />
          {order.deliveryType === "pickup" ? t("deliveryPickup") : t("deliveryCouriered")}
        </span>
      </div>
      <dl className="mt-4 grid min-w-0 grid-cols-2 gap-4 border-t border-border pt-4 text-body-b6">
        <div className="col-span-2 min-w-0">
          <dt className="text-body-b8 text-muted-foreground">{t("colCustomer")}</dt>
          <dd className="mt-1 break-words font-medium text-foreground">{customer?.name ?? order.userId}</dd>
          {customer?.phone && <dd className="mt-0.5 text-body-b8 text-muted-foreground"><bdi dir="ltr">{maskPhoneNumber(customer.phone)}</bdi></dd>}
        </div>
        <div className="min-w-0">
          <dt className="text-body-b8 text-muted-foreground">{t("colPlaced")}</dt>
          <dd className="mt-1 text-foreground">{formatOrderDateShort(order.placedAt, locale)}</dd>
          <dd className="mt-0.5 text-body-b8 text-muted-foreground">{formatOrderTime(order.placedAt, locale)}</dd>
        </div>
        <div className="min-w-0 text-end">
          <dt className="text-body-b8 text-muted-foreground">{t("colTotal")}</dt>
          <dd className="mt-1 break-words font-semibold tabular-nums text-foreground">{formatMoney(orderNetPaid(order, order.refunds), locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
