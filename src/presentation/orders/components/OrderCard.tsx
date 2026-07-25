import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, RotateCcw } from "lucide-react";
import type { Order, OrderItem } from "@/src/domain/entities/Order";
import { Icon, Thumbnail } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDate, formatOrderTime } from "@/src/lib/formatOrderDate";
import { formatDeliveryWindow } from "@/src/lib/formatDeliveryWindow";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderCardActions } from "./OrderCardActions";
import { OrderAdjustments } from "./OrderAdjustments";
import { OrderLocationRow } from "./OrderLocationRow";

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
      <dd className="text-end text-foreground">{value}</dd>
    </div>
  );
}

/** A one-line note on the storefront card for a line a picker substituted or refunded. */
function SubstitutionNote({ item }: { item: OrderItem }) {
  const t = useTranslations("orders");
  const { substitution } = item;
  if (!substitution) return null;

  if (substitution.status === "substituted") {
    return (
      <li className="flex items-center gap-1.5 text-body-b8 text-foreground">
        <Icon icon={ArrowLeftRight} size="xs" className="shrink-0 text-primary" />
        <span className="truncate">
          {item.name} → {substitution.replacement?.name ?? t("replacementFallback")}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1.5 text-body-b8 text-muted-foreground">
      <Icon icon={RotateCcw} size="xs" className="shrink-0" />
      <span className="truncate">{t("refundedNote", { name: item.name })}</span>
    </li>
  );
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const deliveryWindow = formatDeliveryWindow(order, locale);
  const visibleItems = order.items.slice(0, MAX_VISIBLE_THUMBNAILS);
  const extraCount = order.items.length - visibleItems.length;
  const substituted = order.items.filter((item) => item.substitution);

  return (
    <article className="flex flex-col gap-4 rounded-card-xl bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-body-b2 text-foreground">{t("detailsHeading")}</h2>
        <OrderStatusBadge status={order.status} stage={order.stage} />
      </div>

      <dl className="flex flex-col gap-2">
        <OrderInfoRow label={t("timeLabel")} value={formatOrderTime(order.placedAt, locale)} />
        <OrderInfoRow label={t("dateLabel")} value={formatOrderDate(order.placedAt, locale)} />
        {deliveryWindow && <OrderInfoRow label={t("deliveryLabel")} value={deliveryWindow} />}
        <OrderLocationRow location={order.location} label={order.locationLabel} />
      </dl>

      <div className="flex items-center justify-between gap-2">
        <ul className="flex items-center gap-1">
          {visibleItems.map((item) => (
            <Thumbnail as="li" key={item.productId} className="size-13">
              <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-contain" />
            </Thumbnail>
          ))}
          {extraCount > 0 && (
            <li className="text-label-l1 text-foreground">+{extraCount}</li>
          )}
        </ul>

        <div className="shrink-0 text-end">
          <p className="text-body-b9 text-foreground">{formatMoney(order.total, locale)}</p>
          {order.taxAmount != null && (
            <p className="text-body-b9 text-muted-foreground">
              {t("includesVat", { amount: formatMoney(order.taxAmount, locale) })}
            </p>
          )}
        </div>
      </div>

      {substituted.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-card-md bg-surface-sunken px-3 py-2">
          {substituted.map((item) => (
            <SubstitutionNote key={item.productId} item={item} />
          ))}
        </ul>
      )}

      <OrderAdjustments order={order} />

      <OrderCardActions order={order} />
    </article>
  );
}
