"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ArrowLeftRight, RotateCcw } from "lucide-react";
import type { Order, OrderItem } from "@/src/domain/entities/Order";
import { isPicking } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Icon } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { OrderStageSelect } from "./OrderStageSelect";
import { OrderReturnControl } from "./OrderReturnControl";
import { OrderItemPickControl } from "./OrderItemPickControl";

type OrderRowProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
  /** Total column count of the parent table — the detail row spans all of them. */
  columnCount: number;
};

/** An order is trackable while it's live and not cancelled — mirrors the tracking repo's rule. */
function isTrackable(order: Order): boolean {
  return order.phase === "current" && order.status !== "cancelled";
}

/** The outcome shown once a picker has resolved an out-of-stock line. */
function ItemSubstitutionBadge({ item }: { item: OrderItem }) {
  const t = useTranslations("dashOrders");
  const { substitution } = item;
  if (!substitution) return null;

  if (substitution.status === "substituted") {
    return (
      <p className="flex items-center gap-1.5 ps-13 text-body-b8 text-primary">
        <Icon icon={ArrowLeftRight} size="xs" />
        {t("substitutedWith", { name: substitution.replacement?.name ?? t("replacementFallback") })}
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 ps-13 text-body-b8 text-muted-foreground">
      <Icon icon={RotateCcw} size="xs" />
      {t("refundedOutOfStock")}
    </p>
  );
}

/**
 * One order row plus an expandable detail row. The summary row mirrors the table
 * columns; toggling the disclosure reveals the order's line items and total —
 * both already carried on the order, so no extra fetch. Client-only for the
 * ephemeral open/closed state.
 */
export function OrderRow({ order, customer, columnCount }: OrderRowProps) {
  const t = useTranslations("dashOrders");
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const pickable = isPicking(order);

  return (
    <>
      <tr className="bg-background">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? t("hideDetailsAria", { id: order.id }) : t("showDetailsAria", { id: order.id })}
            className="flex size-6 items-center justify-center rounded-input text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon
              icon={ChevronDown}
              size="xs"
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="text-body-b7 text-foreground">{customer?.name ?? order.userId}</span>
          {customer?.phone ? (
            <span className="block text-body-b8 text-muted-foreground">{customer.phone}</span>
          ) : null}
        </td>
        <td className="px-4 py-3 text-body-b7 text-foreground">{order.id}</td>
        <td className="px-4 py-3">
          <OrderStatusBadge status={order.status} stage={order.stage} />
        </td>
        <td className="px-4 py-3 text-body-b6 text-muted-foreground">
          {formatOrderDate(order.placedAt, locale)}
        </td>
        <td className="px-4 py-3 text-body-b6 text-muted-foreground">{order.location}</td>
        <td className="px-4 py-3">
          <div className="flex justify-end">
            {order.status === "return_requested" ? (
              <OrderReturnControl orderId={order.id} />
            ) : isTrackable(order) && order.stage ? (
              <OrderStageSelect orderId={order.id} stage={order.stage} />
            ) : (
              <span className="text-body-b8 text-muted-foreground">{t("notTrackable")}</span>
            )}
          </div>
        </td>
      </tr>

      {open ? (
        <tr className="bg-surface-sunken/40">
          <td colSpan={columnCount} className="px-4 py-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-body-b8 uppercase tracking-wide text-muted-foreground">
                {t("itemCount", { count: itemCount })}
              </h3>
              <ul className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className={`size-full object-contain ${
                            item.substitution?.status === "refunded" ? "opacity-40" : ""
                          }`}
                        />
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-body-b7 ${
                          item.substitution?.status === "refunded"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="shrink-0 text-body-b7 text-muted-foreground">
                        × {item.quantity}
                      </span>
                    </div>

                    {item.substitution ? (
                      <ItemSubstitutionBadge item={item} />
                    ) : pickable ? (
                      <div className="ps-13">
                        <OrderItemPickControl orderId={order.id} item={item} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-body-b7 text-muted-foreground">{t("total")}</span>
                <span className="text-body-b5 text-foreground">{formatMoney(order.total, locale)}</span>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
