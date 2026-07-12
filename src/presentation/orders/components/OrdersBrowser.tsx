"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { Order, OrderPhase } from "@/src/domain/entities/Order";
import { OrderTabs } from "./OrderTabs";
import { OrderCard } from "./OrderCard";

interface OrdersBrowserProps {
  orders: Order[];
}

/**
 * Tabbed orders view: a current/previous filter over the user's orders.
 * Filtering is client-side so tab switches are instant.
 */
export function OrdersBrowser({ orders }: OrdersBrowserProps) {
  const t = useTranslations("orders");
  const [phase, setPhase] = React.useState<OrderPhase>("current");

  const visible = orders.filter((order) => order.phase === phase);

  return (
    <div className="flex flex-col gap-4">
      <OrderTabs value={phase} onValueChange={setPhase} />

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {visible.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-16 text-center text-body-b4 text-muted-foreground">
          {t("emptyPhase", { phase })}
        </p>
      )}
    </div>
  );
}
