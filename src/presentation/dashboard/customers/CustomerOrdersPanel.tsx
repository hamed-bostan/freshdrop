"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { Order, PaymentStatus } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";
import { Badge, Button, DataGridBody, DataGridHeader, DataTable, focusRing, Icon } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";

const PAGE_SIZE = 8;
const CUSTOMER_ORDERS_ROW_GRID =
  "grid grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.65fr)_2rem] items-center gap-4";

const PAYMENT_VARIANT: Record<PaymentStatus, "primary" | "warning" | "error" | "neutral"> = {
  paid: "primary",
  pending: "warning",
  failed: "error",
  refunded: "neutral",
};

type CustomerOrdersPanelProps = { orders: Order[] };

export function CustomerOrdersPanel({ orders }: CustomerOrdersPanelProps) {
  const t = useTranslations("dashCustomerDetail");
  const tOrders = useTranslations("dashOrders");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const visible = useMemo(() => orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [orders, page]);
  const first = orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, orders.length);

  if (orders.length === 0) {
    return <p className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center text-body-b6 text-muted-foreground">{t("noOrders")}</p>;
  }

  return (
    <DataTable
      minWidthClassName="min-w-[51rem]"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-body-b10 text-muted-foreground">{t("showingOrders", { first: formatNumber(first, locale), last: formatNumber(last, locale), total: formatNumber(orders.length, locale) })}</p>
          {pages > 1 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" iconOnly aria-label={t("previousPage")} disabled={page === 1} onClick={() => setPage((current) => current - 1)}><Icon icon={ChevronLeft} size="xs" className="rtl:rotate-180" /></Button>
              {Array.from({ length: pages }, (_, index) => index + 1).slice(0, 5).map((number) => (
                <Button key={number} variant={number === page ? "outline" : "ghost"} size="sm" iconOnly className={number === page ? "border-primary bg-accent" : "border border-border"} onClick={() => setPage(number)} aria-current={number === page ? "page" : undefined}>{formatNumber(number, locale)}</Button>
              ))}
              <Button variant="outline" size="sm" iconOnly aria-label={t("nextPage")} disabled={page === pages} onClick={() => setPage((current) => current + 1)}><Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" /></Button>
            </div>
          ) : null}
        </div>
      }
    >
      <DataGridHeader template={CUSTOMER_ORDERS_ROW_GRID}>
        <span>{tOrders("colOrder")}</span>
        <span>{t("date")}</span>
        <span>{t("payment")}</span>
        <span>{t("fulfillment")}</span>
        <span className="text-end">{tOrders("colTotal")}</span>
        <span aria-hidden />
      </DataGridHeader>
      <DataGridBody>
        {visible.map((order) => (
          <Link
            key={order.id}
            href={`/dashboard/orders/${order.id}`}
            aria-label={tOrders("viewOrderAria", { id: order.orderNumber })}
            className={cn(CUSTOMER_ORDERS_ROW_GRID, focusRing, "bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50")}
          >
            <span className="truncate font-mono text-body-b8 text-primary">#{order.orderNumber}</span>
            <time dateTime={order.placedAt} className="truncate text-body-b10 text-muted-foreground">{formatDateTime(order.placedAt, locale)}</time>
            <span className="flex min-w-0 items-center gap-2">
              <Badge variant={PAYMENT_VARIANT[order.paymentStatus]} size="sm">{tOrders(`filterPayment${capitalize(order.paymentStatus)}`)}</Badge>
              <span className="truncate text-body-b10 text-muted-foreground">{order.walletApplied > 0 ? t("wallet") : t("cardPayment")}</span>
            </span>
            <span className="justify-self-start"><OrderStatusBadge status={order.status} stage={order.stage} context="admin" size="sm" /></span>
            <span className="text-end text-body-b8 tabular-nums text-foreground">{formatMoney(orderNetPaid(order, order.refunds), locale)}</span>
            <Icon icon={MoreHorizontal} size="xs" className="text-muted-foreground" />
          </Link>
        ))}
      </DataGridBody>
    </DataTable>
  );
}

function capitalize(value: PaymentStatus): "Paid" | "Pending" | "Failed" | "Refunded" {
  return `${value[0].toUpperCase()}${value.slice(1)}` as "Paid" | "Pending" | "Failed" | "Refunded";
}

function formatDateTime(iso: string, locale: Locale): string {
  return `${formatOrderDateShort(iso, locale)}, ${formatOrderTime(iso, locale)}`;
}
