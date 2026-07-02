import Image from "next/image";
import type { Order } from "@/src/domain/entities/Order";
import { formatOrderDate, formatOrderTime } from "@/src/lib/formatOrderDate";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderCardActions } from "./OrderCardActions";

/** Thumbnails shown before collapsing the rest into a "+N" count. */
const MAX_VISIBLE_THUMBNAILS = 4;

interface OrderInfoRowProps {
  label: string;
  value: string;
}

function OrderInfoRow({ label, value }: OrderInfoRowProps) {
  return (
    <div className="flex items-start text-body-b6 justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const visibleItems = order.items.slice(0, MAX_VISIBLE_THUMBNAILS);
  const extraCount = order.items.length - visibleItems.length;

  return (
    <article className="flex flex-col gap-4 rounded-card-xl bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-body-b2 text-foreground">Order details:</h2>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="flex flex-col gap-2">
        <OrderInfoRow label="Time:" value={formatOrderTime(order.placedAt)} />
        <OrderInfoRow label="Date:" value={formatOrderDate(order.placedAt)} />
        <OrderInfoRow label="Location:" value={order.location} />
      </dl>

      <div className="flex items-center justify-between gap-2">
        <ul className="flex items-center gap-1">
          {visibleItems.map((item) => (
            <li
              key={item.productId}
              className="flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken"
            >
              <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-contain" />
            </li>
          ))}
          {extraCount > 0 && (
            <li className="text-label-l1 text-foreground">+{extraCount}</li>
          )}
        </ul>

        <p className="shrink-0 text-body-b9 text-foreground">
          $ {order.total.toFixed(2)}
        </p>
      </div>

      <OrderCardActions order={order} />
    </article>
  );
}
